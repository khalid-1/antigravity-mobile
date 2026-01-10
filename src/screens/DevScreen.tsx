import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    StyleSheet,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Play, Square, ExternalLink, ChevronDown, CheckCircle2, Folder } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/colors';

interface TerminalLine {
    line: string;
    isError: boolean;
}

export default function DevScreen() {
    const { terminalOutput, clearTerminal, projects, activeProject, setActiveProject, api, isConnected } = useApp();
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (terminalOutput.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [terminalOutput]);

    const handleStart = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (activeProject) await api('/dev/start', 'POST', { id: activeProject });
    };

    const handleStop = async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (activeProject) await api('/dev/stop', 'POST', { id: activeProject });
    };

    const activeProjectData = projects.find(p => p.id === activeProject);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Image source={require('../../assets/icon.png')} style={styles.headerLogo} />
                <View>
                    <Text style={styles.headerTitle}>DEV CONSOLE</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.error }]} />
                        <Text style={styles.statusText}>{isConnected ? 'CONNECTED' : 'OFFLINE'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                {/* Project Selector */}
                <TouchableOpacity
                    style={styles.projectSelector}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setShowProjectPicker(true);
                    }}
                >
                    <View style={styles.projectSelectorLeft}>
                        <Folder size={20} color={colors.primary} />
                        <View>
                            <Text style={styles.projectLabel}>TARGET PROJECT</Text>
                            <Text style={styles.projectName}>
                                {activeProjectData?.name || 'Select a project...'}
                            </Text>
                        </View>
                    </View>
                    <ChevronDown size={20} color={colors.textDim} />
                </TouchableOpacity>

                {/* Controls */}
                <View style={[styles.controlsCard, !activeProject && styles.controlsDisabled]}>
                    <View style={styles.controlsRow}>
                        <TouchableOpacity
                            style={styles.playButton}
                            onPress={handleStart}
                            disabled={!activeProject}
                        >
                            <Play size={24} color={colors.success} fill={colors.success} />
                            <Text style={styles.playButtonText}>START</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.stopButton}
                            onPress={handleStop}
                            disabled={!activeProject}
                        >
                            <Square size={24} color={colors.error} fill={colors.error} />
                            <Text style={styles.stopButtonText}>STOP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkButton} disabled={!activeProject}>
                            <ExternalLink size={20} color={colors.textDim} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Terminal */}
                <View style={styles.terminal}>
                    <View style={styles.terminalHeader}>
                        <View style={styles.trafficLights}>
                            <View style={[styles.trafficLight, { backgroundColor: '#FF5F56' }]} />
                            <View style={[styles.trafficLight, { backgroundColor: '#FFBD2E' }]} />
                            <View style={[styles.trafficLight, { backgroundColor: '#27C93F' }]} />
                        </View>
                        <Text style={styles.terminalTitle}>terminal</Text>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                Haptics.selectionAsync();
                                clearTerminal();
                            }}
                        >
                            <Text style={styles.clearButtonText}>CLEAR</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={terminalOutput as TerminalLine[]}
                        keyExtractor={(_, index) => index.toString()}
                        style={styles.terminalOutput}
                        contentContainerStyle={styles.terminalContent}
                        renderItem={({ item }) => (
                            <Text style={[styles.terminalText, item.isError && styles.terminalError]}>
                                {item.line}
                            </Text>
                        )}
                        ListEmptyComponent={
                            <Text style={styles.terminalPlaceholder}>$ waiting for output...</Text>
                        }
                    />
                </View>
            </View>

            {/* Project Picker Modal */}
            <Modal
                visible={showProjectPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowProjectPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowProjectPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>SELECT PROJECT</Text>
                        {projects.length === 0 ? (
                            <Text style={styles.noProjects}>No projects found</Text>
                        ) : (
                            projects.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.projectOption, activeProject === p.id && styles.projectOptionActive]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setActiveProject(p.id);
                                        setShowProjectPicker(false);
                                    }}
                                >
                                    <View style={styles.projectOptionIcon}>
                                        <Folder size={16} color={activeProject === p.id ? colors.primary : colors.textDim} />
                                    </View>
                                    <Text style={[styles.projectOptionText, activeProject === p.id && styles.projectOptionTextActive]}>
                                        {p.name}
                                    </Text>
                                    {activeProject === p.id && <CheckCircle2 size={16} color={colors.primary} />}
                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    headerLogo: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textDim,
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        padding: spacing.md,
        gap: spacing.md,
    },
    projectSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    projectSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    projectLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.textDim,
        letterSpacing: 1,
    },
    projectName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    controlsCard: {
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    controlsDisabled: {
        opacity: 0.5,
    },
    controlsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    playButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.success + '15',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.success + '30',
    },
    playButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.success,
        letterSpacing: 1,
    },
    stopButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.error + '15',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    stopButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.error,
        letterSpacing: 1,
    },
    linkButton: {
        padding: spacing.md,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    terminal: {
        flex: 1,
        backgroundColor: '#0d0d0d',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    terminalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    trafficLights: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    trafficLight: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    terminalTitle: {
        flex: 1,
        fontSize: 11,
        fontWeight: '600',
        color: colors.textDim,
        marginLeft: spacing.md,
    },
    clearButton: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.surfaceHighlight,
    },
    clearButtonText: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textDim,
        letterSpacing: 1,
    },
    terminalOutput: {
        flex: 1,
    },
    terminalContent: {
        padding: spacing.md,
        gap: 2,
    },
    terminalText: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: colors.textDim,
        lineHeight: 16,
    },
    terminalError: {
        color: colors.error,
    },
    terminalPlaceholder: {
        fontSize: 11,
        fontFamily: 'monospace',
        color: colors.textDim,
        opacity: 0.4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: colors.surfaceHighlight,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
    },
    modalTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.textDim,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: 2,
    },
    noProjects: {
        fontSize: 14,
        color: colors.textDim,
        textAlign: 'center',
        padding: spacing.lg,
    },
    projectOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
    },
    projectOptionActive: {
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    projectOptionIcon: {
        width: 32,
        height: 32,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectOptionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDim,
    },
    projectOptionTextActive: {
        color: colors.primary,
        fontWeight: '800',
    },
});
