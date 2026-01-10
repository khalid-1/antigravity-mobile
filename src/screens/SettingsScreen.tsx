import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    Settings as SettingsIcon,
    Key,
    Lock,
    Folder,
    Save,
    CheckCircle2,
    AlertCircle,
    Server,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/colors';

export default function SettingsScreen() {
    const { config, saveConfig, serverHost, setServerHost } = useApp();
    const [localConfig, setLocalConfig] = useState({
        geminiKey: config.geminiKey,
        authToken: config.authToken,
        workspacePath: config.workspacePath,
    });
    const [localServerHost, setLocalServerHost] = useState(serverHost);
    const [status, setStatus] = useState<{ type: '' | 'success' | 'error'; message: string }>({
        type: '',
        message: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setLocalConfig({
            geminiKey: config.geminiKey,
            authToken: config.authToken,
            workspacePath: config.workspacePath,
        });
    }, [config]);

    useEffect(() => {
        setLocalServerHost(serverHost);
    }, [serverHost]);

    const handleSave = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSaving(true);
        setStatus({ type: '', message: '' });

        // Update server host if changed
        if (localServerHost !== serverHost) {
            setServerHost(localServerHost);
        }

        const success = await saveConfig(localConfig);

        if (success) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setStatus({ type: 'success', message: 'Saved Successfully!' });
            setTimeout(() => {
                setStatus({ type: '', message: '' });
                setIsSaving(false);
            }, 2000);
        } else {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setStatus({ type: 'error', message: 'Failed to Save' });
            setTimeout(() => {
                setStatus({ type: '', message: '' });
                setIsSaving(false);
            }, 3000);
        }
    };

    const getButtonStyle = () => {
        if (status.type === 'success') return styles.buttonSuccess;
        if (status.type === 'error') return styles.buttonError;
        return styles.buttonPrimary;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <SettingsIcon size={24} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.title}>System Settings</Text>
                        <Text style={styles.subtitle}>Configure your Antigravity environment</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Server Host */}
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <Server size={12} color={colors.textDim} />
                            <Text style={styles.label}>SERVER ADDRESS</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="192.168.1.100:8787"
                            placeholderTextColor={colors.textDim + '50'}
                            value={localServerHost}
                            onChangeText={setLocalServerHost}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                        <Text style={styles.hint}>Your Mac's LAN or Tailscale IP address</Text>
                    </View>

                    {/* Gemini API Key */}
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <Key size={12} color={colors.textDim} />
                            <Text style={styles.label}>GEMINI API KEY</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your Gemini API Key..."
                            placeholderTextColor={colors.textDim + '50'}
                            secureTextEntry
                            value={localConfig.geminiKey}
                            onChangeText={(text) => setLocalConfig({ ...localConfig, geminiKey: text })}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.hint}>Used for agent intelligence. Supports Gemini 1.5 & 2.0.</Text>
                    </View>

                    {/* Auth Token */}
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <Lock size={12} color={colors.textDim} />
                            <Text style={styles.label}>ACCESS TOKEN (PASSWORD)</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={localConfig.authToken}
                            onChangeText={(text) => setLocalConfig({ ...localConfig, authToken: text })}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.hint}>The password required to connect to this controller.</Text>
                    </View>

                    {/* Workspace Directory */}
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <Folder size={12} color={colors.textDim} />
                            <Text style={styles.label}>WORKSPACE DIRECTORY</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            value={localConfig.workspacePath}
                            onChangeText={(text) => setLocalConfig({ ...localConfig, workspacePath: text })}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.hint}>The root folder where your projects are located.</Text>
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.button, getButtonStyle()]}
                    onPress={handleSave}
                    disabled={isSaving || status.type === 'success'}
                    activeOpacity={0.8}
                >
                    {status.type === 'success' ? (
                        <>
                            <CheckCircle2 size={18} color={colors.text} />
                            <Text style={styles.buttonText}>Saved Successfully!</Text>
                        </>
                    ) : status.type === 'error' ? (
                        <>
                            <AlertCircle size={18} color={colors.text} />
                            <Text style={styles.buttonText}>Failed to Save</Text>
                        </>
                    ) : isSaving ? (
                        <>
                            <ActivityIndicator size="small" color={colors.text} />
                            <Text style={styles.buttonText}>Saving Changes...</Text>
                        </>
                    ) : (
                        <>
                            <Save size={18} color={colors.text} />
                            <Text style={styles.buttonText}>Save Configuration</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Note */}
                <View style={styles.noteCard}>
                    <Text style={styles.noteText}>
                        <Text style={styles.noteBold}>Note: </Text>
                        Updating the Access Token will immediately end your current session and require you to re-log in with the new password.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 120, // Tab bar space
        gap: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingBottom: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textDim,
    },
    form: {
        gap: spacing.lg,
    },
    field: {
        gap: spacing.sm,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginLeft: spacing.xs,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.textDim,
        letterSpacing: 1,
    },
    input: {
        backgroundColor: colors.surfaceHighlight + '80',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        fontSize: 15,
        color: colors.text,
    },
    hint: {
        fontSize: 10,
        color: colors.textDim,
        fontStyle: 'italic',
        marginLeft: spacing.xs,
        opacity: 0.6,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSuccess: {
        backgroundColor: colors.success,
    },
    buttonError: {
        backgroundColor: colors.error,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.text,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noteCard: {
        padding: spacing.md,
        backgroundColor: colors.primary + '10',
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    noteText: {
        fontSize: 11,
        color: colors.primary,
        lineHeight: 16,
    },
    noteBold: {
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
