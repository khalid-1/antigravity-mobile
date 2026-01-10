import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import {
    Send,
    Paperclip,
    Plus,
    MessageSquare,
    History,
    X,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Trash2,
    Square,
} from 'lucide-react-native';
import { Image } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/colors';

interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
    isAction?: boolean;
    file?: { name: string };
}

export default function ChatScreen() {
    const {
        chatHistory,
        setChatHistory,
        isConnected,
        api,
        projects,
        activeProject,
        setActiveProject,
        newChat,
        savedChats,
        loadChat,
    } = useApp();

    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; type: string } | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [model, setModel] = useState('gemini-3-flash-preview');
    const [showModelPicker, setShowModelPicker] = useState(false);

    const availableModels = [
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
    ];

    const [confirmModal, setConfirmModal] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatHistory.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatHistory]);

    const handleStop = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSending(false);
        await api('/chat/stop', 'POST', { projectId: activeProject });
    };

    const handleLoadChat = async (id: string) => {
        await Haptics.selectionAsync();
        setIsHistoryOpen(false);
        await loadChat(id);
    };

    const handleDeleteChat = async (id: string) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await api(`/chats/${id}`, 'DELETE');
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
            });
            if (!result.canceled && result.assets[0]) {
                const file = result.assets[0];
                setSelectedFile({
                    name: file.name,
                    uri: file.uri,
                    type: file.mimeType || 'application/octet-stream',
                });
            }
        } catch (err) {
            console.error('File pick error:', err);
        }
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isSending) return;

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Slash commands
        if (input.trim().toLowerCase() === '/undo') {
            setConfirmModal({
                title: 'Undo Action?',
                message: 'This will attempt to revert the last changes made by the agent.',
                onConfirm: async () => {
                    setInput('');
                    await api('/chat/send', 'POST', {
                        message: 'Undo the last changes you made. Revert the files.',
                        projectId: activeProject,
                        modelId: model,
                    });
                },
            });
            return;
        }

        if (input.trim().toLowerCase() === '/stop') {
            setInput('');
            handleStop();
            return;
        }

        setIsSending(true);
        Keyboard.dismiss();

        const currentMsg = input;
        const currentFile = selectedFile;

        // Optimistic update
        setChatHistory((prev: ChatMessage[]) => [
            ...prev,
            {
                role: 'user',
                content: currentMsg,
                file: currentFile ? { name: currentFile.name } : undefined,
            },
        ]);

        setInput('');
        setSelectedFile(null);

        try {
            // TODO: Add file upload support with base64 encoding
            await api('/chat/send', 'POST', {
                message: currentMsg,
                projectId: activeProject,
                modelId: model,
            });
        } catch (err) {
            console.error('[ChatScreen] Send failed:', err);
            setChatHistory((prev: ChatMessage[]) => [
                ...prev,
                { role: 'bot', content: '_Error: Failed to send message. Please try again._ ⚠️' },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    // Determine status
    const lastMsg = chatHistory[chatHistory.length - 1] as ChatMessage | undefined;
    let agentStatus: string | null = null;
    if (isSending || (lastMsg && lastMsg.role === 'user')) {
        agentStatus = 'Thinking...';
    } else if (lastMsg && lastMsg.role === 'bot' && lastMsg.isAction) {
        agentStatus = 'Running...';
    }

    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        if (item.isAction) {
            return (
                <View style={styles.actionBadge}>
                    <Text style={styles.actionText}>⚡ {item.content}</Text>
                </View>
            );
        }

        const isUser = item.role === 'user';
        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                <Markdown
                    style={isUser ? markdownStylesUser : markdownStylesBot}
                >
                    {item.content.length > 800 ? item.content.slice(0, 800) + '...' : item.content}
                </Markdown>
                {item.file && (
                    <View style={styles.fileAttachment}>
                        <Text style={styles.fileText}>📎 {item.file.name}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setIsHistoryOpen(true);
                    }}
                >
                    <History size={20} color={colors.textDim} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <View style={styles.brandContainer}>
                        <Image source={require('../../assets/icon.png')} style={styles.brandLogo} />
                        <View>
                            <Text style={styles.brandTitle}>ANTIGRAVITY</Text>
                            <TouchableOpacity
                                style={styles.modelSelector}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowModelPicker(true);
                                }}
                            >
                                <Text style={styles.modelSelectorText}>
                                    {availableModels.find(m => m.id === model)?.name || 'Select Model'}
                                </Text>
                                <ChevronDown size={10} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.newChatButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setConfirmModal({
                            title: 'New Conversation',
                            message: 'Are you sure you want to clear the chat and start fresh?',
                            onConfirm: newChat,
                        });
                    }}
                >
                    <Plus size={18} color={colors.primary} strokeWidth={3} />
                </TouchableOpacity>
            </View>

            {/* Model Picker Modal */}
            <Modal
                visible={showModelPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModelPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowModelPicker(false)}
                >
                    <View style={styles.modelPickerContent}>
                        <Text style={styles.modelPickerTitle}>SELECT INTELLIGENCE</Text>
                        {availableModels.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={[styles.modelOption, model === m.id && styles.modelOptionActive]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setModel(m.id);
                                    setShowModelPicker(false);
                                }}
                            >
                                <Text style={[styles.modelOptionText, model === m.id && styles.modelOptionTextActive]}>
                                    {m.name}
                                </Text>
                                {model === m.id && <CheckCircle2 size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={chatHistory as ChatMessage[]}
                renderItem={renderMessage}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Image source={require('../../assets/icon.png')} style={styles.emptyLogo} />
                        <Text style={styles.emptyTitle}>Antigravity</Text>
                        <Text style={styles.emptySubtitle}>AWAITING YOUR COMMAND...</Text>
                    </View>
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {selectedFile && (
                    <View style={styles.filePreview}>
                        <Text style={styles.filePreviewText}>📎 {selectedFile.name}</Text>
                        <TouchableOpacity onPress={() => setSelectedFile(null)}>
                            <X size={16} color={colors.textDim} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton} onPress={handleFilePick}>
                        <Paperclip size={20} color={colors.textDim} />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        placeholder="Ask agent... (/undo to revert)"
                        placeholderTextColor={colors.textDim + '80'}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={4000}
                    />

                    {agentStatus ? (
                        <View style={styles.statusContainer}>
                            <View style={styles.statusBadge}>
                                <View style={styles.pulsingDot} />
                                <Text style={styles.statusText}>{agentStatus}</Text>
                            </View>
                            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                                <Square size={10} color={colors.error} fill={colors.error} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.sendButton, (input.trim() || selectedFile) && styles.sendButtonActive]}
                            onPress={handleSend}
                            disabled={isSending || (!input.trim() && !selectedFile)}
                        >
                            <Send size={20} color={input.trim() || selectedFile ? colors.text : colors.textDim} />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            {/* History Modal */}
            <Modal
                visible={isHistoryOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsHistoryOpen(false)}
            >
                <SafeAreaView style={styles.historyModal}>
                    <View style={styles.historyHeader}>
                        <View style={styles.historyTitleRow}>
                            <History size={20} color={colors.primary} />
                            <Text style={styles.historyTitle}>HISTORY</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsHistoryOpen(false)}>
                            <X size={24} color={colors.textDim} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={savedChats}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.historyList}
                        renderItem={({ item }) => (
                            <View style={styles.historyRow}>
                                <TouchableOpacity
                                    style={styles.historyItem}
                                    onPress={() => handleLoadChat(item.id)}
                                >
                                    <MessageSquare size={16} color={colors.primary + '99'} />
                                    <View style={styles.historyItemContent}>
                                        <Text style={styles.historyItemTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.historyItemDate}>
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <ChevronRight size={14} color={colors.textDim} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDeleteChat(item.id)}
                                >
                                    <Trash2 size={18} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.historyEmpty}>
                                <MessageSquare size={32} color={colors.textDim + '50'} />
                                <Text style={styles.historyEmptyText}>No previous chats</Text>
                            </View>
                        }
                    />

                    <TouchableOpacity
                        style={styles.newChatFullButton}
                        onPress={() => {
                            setIsHistoryOpen(false);
                            newChat();
                        }}
                    >
                        <Plus size={16} color={colors.text} strokeWidth={3} />
                        <Text style={styles.newChatFullButtonText}>START NEW CHAT</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                visible={!!confirmModal}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmModal(null)}
            >
                <View style={styles.confirmOverlay}>
                    <View style={styles.confirmModal}>
                        <View style={styles.confirmIcon}>
                            <MessageSquare size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.confirmTitle}>{confirmModal?.title}</Text>
                        <Text style={styles.confirmMessage}>{confirmModal?.message}</Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                style={styles.confirmCancel}
                                onPress={() => setConfirmModal(null)}
                            >
                                <Text style={styles.confirmCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmConfirm}
                                onPress={() => {
                                    confirmModal?.onConfirm();
                                    setConfirmModal(null);
                                }}
                            >
                                <Text style={styles.confirmConfirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const markdownStylesUser = StyleSheet.create({
    body: { color: colors.text, fontSize: 14, lineHeight: 20 },
    code_inline: { backgroundColor: 'rgba(255,255,255,0.1)', color: colors.text, paddingHorizontal: 4, borderRadius: 4 },
    code_block: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 8 },
    link: { color: '#87ceeb' },
});

const markdownStylesBot = StyleSheet.create({
    body: { color: '#e5e5e5', fontSize: 14, lineHeight: 20 },
    code_inline: { backgroundColor: colors.surfaceHighlight, color: colors.primary, paddingHorizontal: 4, borderRadius: 4 },
    code_block: { backgroundColor: colors.surfaceHighlight, padding: 8, borderRadius: 8 },
    link: { color: colors.primary },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: colors.bg,
    },
    headerButton: {
        padding: spacing.sm,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    headerCenter: {
        alignItems: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    brandLogo: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    brandTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 1,
        marginBottom: 2,
    },
    modelSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: colors.primary + '15',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.primary + '25',
    },
    modelSelectorText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modelPickerContent: {
        width: '100%',
        maxWidth: 300,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    modelPickerTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.textDim,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: 2,
    },
    modelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
    },
    modelOptionActive: {
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    modelOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDim,
    },
    modelOptionTextActive: {
        color: colors.primary,
        fontWeight: '800',
    },
    newChatButton: {
        padding: spacing.sm,
        backgroundColor: colors.primary + '20',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    messageList: {
        padding: spacing.md,
        paddingBottom: 120,
        gap: spacing.md,
    },
    messageBubble: {
        maxWidth: '88%',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    userBubble: {
        backgroundColor: colors.primary,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: colors.surface,
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionBadge: {
        alignSelf: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    actionText: {
        fontSize: 10,
        color: colors.primary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    fileAttachment: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    fileText: {
        fontSize: 12,
        color: colors.text,
        opacity: 0.9,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        opacity: 0.5,
    },
    emptyLogo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontSize: 12,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontStyle: 'italic',
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filePreviewText: {
        fontSize: 12,
        color: colors.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginHorizontal: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.xs,
        backgroundColor: colors.surfaceHighlight + 'CC',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: colors.border,
    },
    attachButton: {
        padding: spacing.sm,
        marginBottom: 2,
    },
    input: {
        flex: 1,
        maxHeight: 100,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xs,
        fontSize: 15,
        color: colors.text,
    },
    sendButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceHighlight,
        marginBottom: 2,
    },
    sendButtonActive: {
        backgroundColor: colors.primary,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: 2,
        marginRight: spacing.xs,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    pulsingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    stopButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.error + '20',
        borderWidth: 1,
        borderColor: colors.error + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyModal: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    historyTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    historyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 1,
    },
    historyList: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    historyRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    historyItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    historyItemContent: {
        flex: 1,
    },
    historyItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    historyItemDate: {
        fontSize: 10,
        color: colors.textDim,
        marginTop: 2,
    },
    deleteButton: {
        padding: spacing.md,
        backgroundColor: colors.error + '20',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.error + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyEmpty: {
        alignItems: 'center',
        paddingVertical: spacing.xl * 2,
    },
    historyEmptyText: {
        fontSize: 12,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: spacing.sm,
    },
    newChatFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
    },
    newChatFullButtonText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 2,
    },
    confirmOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    confirmModal: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    confirmIcon: {
        width: 48,
        height: 48,
        backgroundColor: colors.primary + '20',
        borderRadius: borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    confirmMessage: {
        fontSize: 14,
        color: colors.textDim,
        lineHeight: 20,
        marginBottom: spacing.xl,
    },
    confirmButtons: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    confirmCancel: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    confirmCancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    confirmConfirm: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    confirmConfirmText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
});
