import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/colors';

export default function AuthScreen() {
    const { setToken, serverHost, setServerHost } = useApp();
    const [input, setInput] = useState('');
    const [hostInput, setHostInput] = useState(serverHost);
    const [showHostConfig, setShowHostConfig] = useState(false);

    const handleConnect = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (hostInput !== serverHost) {
            setServerHost(hostInput);
        }
        setToken(input);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.logoContainer}>
                    <View style={styles.logoWrapper}>
                        <Text style={styles.logoEmoji}>🚀</Text>
                    </View>
                    <Text style={styles.title}>Antigravity</Text>
                    <Text style={styles.subtitle}>Remote Mac Controller</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="AG_CONTROL_TOKEN"
                        placeholderTextColor={colors.textDim}
                        secureTextEntry
                        value={input}
                        onChangeText={setInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        style={[styles.button, !input && styles.buttonDisabled]}
                        onPress={handleConnect}
                        disabled={!input}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Connect</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.configToggle}
                        onPress={() => setShowHostConfig(!showHostConfig)}
                    >
                        <Text style={styles.configToggleText}>
                            {showHostConfig ? 'Hide Server Config' : 'Configure Server'}
                        </Text>
                    </TouchableOpacity>

                    {showHostConfig && (
                        <View style={styles.hostConfig}>
                            <Text style={styles.label}>Server Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="192.168.1.100:8787"
                                placeholderTextColor={colors.textDim}
                                value={hostInput}
                                onChangeText={setHostInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                            <Text style={styles.hint}>
                                Enter your Mac's LAN/Tailscale IP address
                            </Text>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl * 2,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    logoEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    form: {
        gap: spacing.md,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        fontSize: 16,
        color: colors.text,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    configToggle: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    configToggleText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    hostConfig: {
        gap: spacing.sm,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    label: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: spacing.xs,
    },
    hint: {
        fontSize: 11,
        color: colors.textDim,
        fontStyle: 'italic',
        marginLeft: spacing.xs,
    },
});
