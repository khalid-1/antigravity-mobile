import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Settings, Server, Key, Folder, LogOut, ChevronRight, Bell, Shield, CircleHelp, ChevronDown, Check, Save } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useApp } from '../context/AppContext';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
    const { config, saveConfig, serverHost, setServerHost, setToken } = useApp();

    // Local state for configuration
    const [localConfig, setLocalConfig] = useState({
        geminiKey: config.geminiKey || '',
        authToken: config.authToken || '',
        workspacePath: config.workspacePath || '',
    });
    const [localServerHost, setLocalServerHost] = useState(serverHost);

    // UI state
    const [isServerConfigExpanded, setIsServerConfigExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Sync from context when it changes (initial load)
    useEffect(() => {
        setLocalConfig({
            geminiKey: config.geminiKey || '',
            authToken: config.authToken || '',
            workspacePath: config.workspacePath || '',
        });
        setLocalServerHost(serverHost);
    }, [config, serverHost]);

    const handleSave = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSaving(true);
        setSaveStatus('idle');

        // Update server host first if changed
        if (localServerHost !== serverHost) {
            setServerHost(localServerHost);
        }

        const success = await saveConfig(localConfig);

        setIsSaving(false);
        if (success) {
            setSaveStatus('success');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
            setSaveStatus('error');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Terminate Session",
            "Are you sure you want to disconnect from the uplink?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Terminate",
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        setToken(null);
                    }
                }
            ]
        );
    };

    return (
        <ScreenWrapper style="px-4 pt-6">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header */}
                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-[#171717] rounded-3xl items-center justify-center mb-4 border border-[#262626] shadow-lg shadow-violet-900/10">
                        <Settings size={32} color="#8b5cf6" />
                    </View>
                    <Text className="text-white text-2xl font-black tracking-tight">System Configuration</Text>
                    <Text className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">v1.0.0 (Build 42)</Text>
                </View>

                {/* Collapsible Server Configuration */}
                <View className="mb-6">
                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-5 bg-neutral-900 active:bg-neutral-800"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setIsServerConfigExpanded(!isServerConfigExpanded);
                            }}
                            activeOpacity={0.9}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="w-10 h-10 rounded-2xl bg-violet-900/20 items-center justify-center border border-violet-500/20">
                                    <Server size={20} color="#a78bfa" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Server Configuration</Text>
                                    <Text className="text-neutral-500 text-xs mt-0.5 font-mono">{localServerHost}</Text>
                                </View>
                            </View>
                            <ChevronDown
                                size={20}
                                color="#525252"
                                style={{ transform: [{ rotate: isServerConfigExpanded ? '180deg' : '0deg' }] }}
                            />
                        </TouchableOpacity>

                        {isServerConfigExpanded && (
                            <View className="px-5 pb-6 pt-2 border-t border-neutral-800 bg-[#0d0d0d]">
                                {/* Server Address */}
                                <View className="mb-5">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Server size={12} color="#737373" />
                                        <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Server Address</Text>
                                    </View>
                                    <TextInput
                                        value={localServerHost}
                                        onChangeText={setLocalServerHost}
                                        className="bg-[#171717] text-white p-4 rounded-xl border border-[#262626] font-mono text-sm focus:border-violet-500"
                                        placeholder="192.168.1.100:8787"
                                        placeholderTextColor="#404040"
                                        autoCapitalize="none"
                                        keyboardType="url"
                                        autoCorrect={false}
                                    />
                                </View>

                                {/* Gemini API Key */}
                                <View className="mb-5">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Key size={12} color="#737373" />
                                        <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Gemini API Key</Text>
                                    </View>
                                    <TextInput
                                        value={localConfig.geminiKey}
                                        onChangeText={(text) => setLocalConfig(prev => ({ ...prev, geminiKey: text }))}
                                        className="bg-[#171717] text-white p-4 rounded-xl border border-[#262626] font-mono text-sm focus:border-violet-500"
                                        placeholder="Enter API Key..."
                                        placeholderTextColor="#404040"
                                        secureTextEntry
                                        autoCapitalize="none"
                                    />
                                </View>

                                {/* Workspace Path */}
                                <View className="mb-6">
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <Folder size={12} color="#737373" />
                                        <Text className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Workspace Path</Text>
                                    </View>
                                    <TextInput
                                        value={localConfig.workspacePath}
                                        onChangeText={(text) => setLocalConfig(prev => ({ ...prev, workspacePath: text }))}
                                        className="bg-[#171717] text-white p-4 rounded-xl border border-[#262626] font-mono text-sm focus:border-violet-500"
                                        placeholder="/path/to/projects"
                                        placeholderTextColor="#404040"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                {/* Update Button */}
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    className={`w-full py-4 rounded-xl items-center justify-center flex-row gap-2 ${saveStatus === 'success' ? 'bg-green-600' :
                                            saveStatus === 'error' ? 'bg-red-600' :
                                                'bg-violet-600 active:bg-violet-700'
                                        }`}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : saveStatus === 'success' ? (
                                        <>
                                            <Check size={18} color="white" />
                                            <Text className="text-white font-bold uppercase tracking-wider text-xs">Saved</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} color="white" />
                                            <Text className="text-white font-bold uppercase tracking-wider text-xs">Update Settings</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Preferences Section */}
                <View className="mb-8">
                    <Text className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-3 pl-1">Preferences</Text>

                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                        <SettingItem icon={Bell} label="Notifications" value="On" />
                        <View className="h-[1px] bg-neutral-800 ml-16" />
                        <SettingItem icon={Shield} label="Security" subtitle="Access tokens & encryption" />
                        <View className="h-[1px] bg-neutral-800 ml-16" />
                        <SettingItem icon={CircleHelp} label="Support" subtitle="Documentation & help" />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="w-full bg-red-500/10 border border-red-500/20 py-5 rounded-2xl items-center justify-center flex-row gap-2 active:bg-red-500/20"
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text className="text-red-500 font-bold uppercase tracking-widest text-xs">Terminate Session</Text>
                </TouchableOpacity>

                <View className="items-center mt-8 opacity-50">
                    <Text className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em]">Antigravity Mobile</Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const SettingItem = ({ icon: Icon, label, value, subtitle }: any) => (
    <TouchableOpacity
        className="flex-row items-center justify-between p-5 bg-neutral-900 active:bg-neutral-800"
        onPress={() => Haptics.selectionAsync()}
    >
        <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-2xl bg-neutral-800 items-center justify-center border border-neutral-700">
                <Icon size={20} color="#a3a3a3" />
            </View>
            <View>
                <Text className="text-white font-bold text-base">{label}</Text>
                {subtitle && <Text className="text-neutral-500 text-xs mt-0.5">{subtitle}</Text>}
            </View>
        </View>
        <View className="flex-row items-center gap-3">
            {value && <Text className="text-neutral-500 font-medium">{value}</Text>}
            <ChevronRight size={16} color="#525252" />
        </View>
    </TouchableOpacity>
);
