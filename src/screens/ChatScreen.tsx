import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    KeyboardAvoidingView, Platform, Keyboard, Modal,
    StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import {
    Send, Paperclip, Plus, Zap, X, ChevronDown, Check,
    Square, ChevronRight, Folder, Globe
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

/**
 * IMPORTANT: This screen uses React Native's StyleSheet instead of NativeWind.
 * 
 * DO NOT convert this to NativeWind/className styling!
 * 
 * NativeWind causes a "Couldn't find navigation context" crash when typing
 * in the TextInput. This is a known compatibility issue between NativeWind's
 * styling engine and React Navigation during re-renders.
 * 
 * The fix is to use StyleSheet.create() for all styling in this component.
 */

export default function ChatScreen() {
    const insets = useSafeAreaInsets();
    const {
        chatHistory, setChatHistory, api, activeProject, setActiveProject,
        activeModel, setActiveModel, models, isConnected, isThinking,
        stopGeneration, toggleMessageExpanded, projects, newChat
    } = useApp();

    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; type: string } | null>(null);
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (chatHistory.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isSending || isThinking) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        setIsSending(true);

        const msg = input;
        const file = selectedFile;

        setChatHistory((prev: any[]) => [...prev, { role: 'user', content: msg, file: file ? { name: file.name } : undefined }]);
        setInput('');
        setSelectedFile(null);

        try {
            await api('/chat/send', 'POST', { message: msg, projectId: activeProject, model: activeModel });
        } catch (e) {
            setChatHistory((prev: any[]) => [...prev, { role: 'bot', content: '_Error sending message_' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleNewChat = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await newChat();
    };

    const handleStop = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        await stopGeneration();
    };

    const handleFilePick = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            "Select Attachment",
            "Choose a source",
            [
                { text: "Photo Library", onPress: pickImage },
                { text: "Files", onPress: pickDocument },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                quality: 1,
            });
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setSelectedFile({
                    name: asset.fileName || `image_${Date.now()}.jpg`,
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg'
                });
            }
        } catch (e) {
            console.log('Error picking image:', e);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            if (!result.canceled && result.assets[0]) {
                setSelectedFile({
                    name: result.assets[0].name,
                    uri: result.assets[0].uri,
                    type: result.assets[0].mimeType || 'application/octet-stream'
                });
            }
        } catch (e) {
            console.log('Error picking document:', e);
        }
    };

    const getProjectName = () => {
        if (!activeProject) return 'General Context';
        const project = projects.find((p: any) => p.id === activeProject);
        return project?.name || 'General Context';
    };

    const renderMessage = ({ item, index }: { item: any; index: number }) => {
        const isUser = item.role === 'user';

        // Collapsible action bubble
        if (item.isAction && item.isCollapsible) {
            return (
                <TouchableOpacity
                    onPress={() => toggleMessageExpanded(index)}
                    style={styles.actionBubble}
                    activeOpacity={0.7}
                >
                    <ChevronRight
                        size={12}
                        color="#a78bfa"
                        style={{ transform: [{ rotate: item.isExpanded ? '90deg' : '0deg' }] }}
                    />
                    <Zap size={10} color="#a78bfa" />
                    <Text style={styles.actionText} numberOfLines={item.isExpanded ? undefined : 1}>
                        {item.content}
                    </Text>
                </TouchableOpacity>
            );
        }

        // Regular action (non-collapsible)
        if (item.isAction) {
            return (
                <View style={styles.actionBubble}>
                    <Zap size={10} color="#a78bfa" />
                    <Text style={styles.actionText}>{item.content}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                <Markdown style={{
                    body: { color: isUser ? '#fff' : '#e5e5e5', fontSize: 14 },
                    code_block: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 10, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
                    code_inline: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
                    heading1: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
                    heading2: { color: '#fff', fontWeight: 'bold', marginTop: 6 },
                    heading3: { color: '#e5e5e5', fontWeight: '600', marginTop: 4 },
                    bullet_list: { marginLeft: 8 },
                    ordered_list: { marginLeft: 8 },
                    link: { color: '#a78bfa' },
                }}>
                    {item.content}
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleNewChat} style={styles.headerButton}>
                    <Plus size={18} color="#a3a3a3" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowModelSelector(true)} style={styles.headerCenter}>
                    <Text style={styles.modelName}>{activeModel}</Text>
                    <Text style={styles.connectionStatus}>{isConnected ? 'Connected' : 'Offline'}</Text>
                    <ChevronDown size={12} color="#737373" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowProjectSelector(true)} style={styles.headerButton}>
                    <Folder size={18} color="#a3a3a3" />
                </TouchableOpacity>
            </View>

            {/* Project Context Bar */}
            <TouchableOpacity onPress={() => setShowProjectSelector(true)} style={styles.contextBar}>
                {activeProject ? <Folder size={14} color="#8b5cf6" /> : <Globe size={14} color="#8b5cf6" />}
                <Text style={styles.contextText}>{getProjectName()}</Text>
                <ChevronDown size={12} color="#525252" />
            </TouchableOpacity>

            {/* Model Selector Modal */}
            <Modal visible={showModelSelector} transparent={true} animationType="fade" onRequestClose={() => setShowModelSelector(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setShowModelSelector(false)} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select AI Model</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {models.map((model: string) => (
                                <TouchableOpacity
                                    key={model}
                                    onPress={() => {
                                        setActiveModel(model);
                                        setShowModelSelector(false);
                                        Haptics.selectionAsync();
                                    }}
                                    style={[styles.modelOption, activeModel === model && styles.modelOptionActive]}
                                >
                                    <Text style={[styles.modelOptionText, activeModel === model && styles.modelOptionTextActive]}>{model}</Text>
                                    {activeModel === model && <Check size={16} color="#8b5cf6" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Project Selector Modal */}
            <Modal visible={showProjectSelector} transparent={true} animationType="fade" onRequestClose={() => setShowProjectSelector(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setShowProjectSelector(false)} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Context</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {/* General Context Option */}
                            <TouchableOpacity
                                onPress={() => {
                                    setActiveProject(null);
                                    setShowProjectSelector(false);
                                    Haptics.selectionAsync();
                                }}
                                style={[styles.modelOption, !activeProject && styles.modelOptionActive]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Globe size={16} color={!activeProject ? "#8b5cf6" : "#737373"} />
                                    <Text style={[styles.modelOptionText, !activeProject && styles.modelOptionTextActive]}>General Context</Text>
                                </View>
                                {!activeProject && <Check size={16} color="#8b5cf6" />}
                            </TouchableOpacity>

                            {/* Project List */}
                            {projects.map((project: any) => (
                                <TouchableOpacity
                                    key={project.id}
                                    onPress={() => {
                                        setActiveProject(project.id);
                                        setShowProjectSelector(false);
                                        Haptics.selectionAsync();
                                    }}
                                    style={[styles.modelOption, activeProject === project.id && styles.modelOptionActive]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Folder size={16} color={activeProject === project.id ? "#8b5cf6" : "#737373"} />
                                        <Text style={[styles.modelOptionText, activeProject === project.id && styles.modelOptionTextActive]}>{project.name}</Text>
                                    </View>
                                    {activeProject === project.id && <Check size={16} color="#8b5cf6" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={chatHistory}
                renderItem={renderMessage}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                style={{ flex: 1 }}
            />

            {/* Thinking Indicator Bar */}
            {isThinking && (
                <View style={styles.thinkingBar}>
                    <ActivityIndicator size="small" color="#8b5cf6" />
                    <Text style={styles.thinkingText}>Agent is processing...</Text>
                    <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
                        <Square size={12} color="#ef4444" fill="#ef4444" />
                        <Text style={styles.stopButtonText}>Stop</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    {selectedFile && (
                        <View style={styles.selectedFileRow}>
                            <Text style={styles.selectedFileText}>📎 {selectedFile.name}</Text>
                            <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                <X size={14} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <TouchableOpacity onPress={handleFilePick} style={styles.inputButton}>
                            <Paperclip size={20} color="#737373" />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask agent..."
                            placeholderTextColor="#525252"
                            multiline
                            value={input}
                            onChangeText={setInput}
                        />

                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={(!input && !selectedFile) || isThinking}
                            style={[
                                styles.sendButton,
                                (input || selectedFile) && !isThinking && styles.sendButtonActive
                            ]}
                        >
                            <Send size={18} color={(input || selectedFile) && !isThinking ? 'white' : '#525252'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0a0a0a',
        borderBottomWidth: 1,
        borderBottomColor: '#171717',
    },
    headerButton: {
        padding: 10,
        backgroundColor: '#171717',
        borderRadius: 20,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modelName: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    connectionStatus: {
        color: '#525252',
        fontSize: 9,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    contextBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#171717',
        gap: 6,
    },
    contextText: {
        color: '#a3a3a3',
        fontSize: 12,
        fontWeight: '500',
    },
    actionBubble: {
        alignSelf: 'center',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        marginVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        maxWidth: '90%',
    },
    actionText: {
        color: '#a78bfa',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        maxWidth: '88%',
        marginBottom: 12,
    },
    userBubble: {
        backgroundColor: '#8b5cf6',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#171717',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#262626',
    },
    fileAttachment: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    fileText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    thinkingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#171717',
        borderTopWidth: 1,
        borderTopColor: '#262626',
        gap: 12,
    },
    thinkingText: {
        color: '#a3a3a3',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    stopButtonText: {
        color: '#ef4444',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        backgroundColor: '#171717',
        borderRadius: 24,
        paddingVertical: 20,
        borderWidth: 1,
        borderColor: '#262626',
    },
    modalTitle: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        fontSize: 16,
    },
    modelOption: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modelOptionActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    modelOptionText: {
        color: '#a3a3a3',
        fontSize: 14,
        fontWeight: '500',
    },
    modelOptionTextActive: {
        color: '#a78bfa',
    },
    inputArea: {
        padding: 16,
        backgroundColor: '#0a0a0a',
        borderTopWidth: 1,
        borderTopColor: '#171717',
    },
    selectedFileRow: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#262626',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedFileText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#171717',
        borderWidth: 1,
        borderColor: '#262626',
        borderRadius: 28,
        padding: 6,
    },
    inputButton: {
        padding: 10,
        borderRadius: 20,
    },
    textInput: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
        paddingVertical: 12,
        paddingHorizontal: 4,
        maxHeight: 96,
    },
    sendButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#262626',
    },
    sendButtonActive: {
        backgroundColor: '#8b5cf6',
    },
});
