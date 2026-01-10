Antigravity Mobile UI Refactor Guide

This document contains the complete, modernized source code for the Antigravity Mobile UI. The design system focuses on a deep dark theme (#0a0a0a), violet accents (#8b5cf6), and consistent spacing using NativeWind (Tailwind CSS).

1. Core Component: ScreenWrapper

File: src/components/ScreenWrapper.tsx
Description: The base container for all screens. Sets the safe area and the app-wide background color.

import React from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({ children, style }: { children: React.ReactNode, style?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View className={`flex-1 ${style}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}


2. Authentication Screen

File: src/screens/AuthScreen.tsx
Description: Login screen featuring the rocket logo and explicit hex-code styling to prevent "missing color" issues.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Rocket, Lock } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const { setToken, serverHost, setServerHost } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setToken(input);
      setIsLoading(false);
    }, 800);
  };

  return (
    <ScreenWrapper style="px-0">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 justify-center px-8"
      >
        {/* Header Section */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 bg-[#171717] rounded-3xl items-center justify-center mb-6 border border-[#262626] shadow-lg shadow-violet-900/20">
            <Rocket size={48} color="#8b5cf6" />
          </View>
          <Text className="text-4xl font-black text-white tracking-tighter mb-2">ANTIGRAVITY</Text>
          <Text className="text-[#737373] text-xs tracking-[0.2em] uppercase font-bold">Mobile Controller</Text>
        </View>

        {/* Form Section */}
        <View className="space-y-4 gap-4 w-full">
          <View className="flex-row items-center bg-[#171717]/80 border border-[#262626] rounded-2xl px-5 py-4 focus:border-violet-500">
            <Lock size={20} color="#525252" />
            <TextInput 
              placeholder="ACCESS TOKEN"
              placeholderTextColor="#525252"
              className="flex-1 text-white ml-3 text-base font-medium h-full"
              secureTextEntry
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              selectionColor="#8b5cf6"
            />
          </View>

          <TouchableOpacity 
            onPress={handleLogin}
            disabled={isLoading}
            className="w-full bg-violet-600 active:bg-violet-700 py-4 rounded-2xl shadow-lg shadow-violet-500/20 items-center justify-center mt-2"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold tracking-widest text-sm">INITIALIZE UPLINK</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="items-center mt-4 py-2">
             <Text className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">Configure Server Host</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}


3. Home / Dashboard Screen

File: src/screens/HomeScreen.tsx
Description: Main dashboard with system status card and quick action grid.

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Activity, Layout, Settings, Terminal, MessageSquare, Zap } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const DashboardCard = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity 
    onPress={() => {
      Haptics.selectionAsync();
      onPress && onPress();
    }}
    className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-[48%] mb-4 active:bg-neutral-800"
  >
    <View className={`w-10 h-10 rounded-full items-center justify-center mb-4 ${color}`}>
      <Icon size={20} color="white" />
    </View>
    <Text className="text-white font-bold text-lg leading-tight">{title}</Text>
    <Text className="text-neutral-500 text-xs mt-1">{subtitle}</Text>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper style="px-6 pt-6">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-neutral-400 text-sm font-medium">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold">Commander</Text>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')}
            className="w-10 h-10 bg-neutral-800 rounded-full items-center justify-center"
          >
            <Settings size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View className="bg-violet-600 rounded-3xl p-6 mb-8 shadow-lg overflow-hidden relative">
          <View className="flex-row items-center mb-3">
            <Activity size={18} color="#ddd6fe" />
            <Text className="text-violet-200 ml-2 text-sm font-bold uppercase tracking-wider">System Status</Text>
          </View>
          <Text className="text-white text-5xl font-black mb-1">98%</Text>
          <Text className="text-violet-200 text-sm">All systems operational. No alerts.</Text>
        </View>

        {/* Quick Actions Grid */}
        <View>
          <Text className="text-white font-bold text-lg mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            <DashboardCard 
              title="Assistant" 
              subtitle="Chat with AI" 
              icon={MessageSquare} 
              color="bg-blue-500" 
              onPress={() => navigation.navigate('Chat')}
            />
            <DashboardCard 
              title="Terminal" 
              subtitle="View logs" 
              icon={Terminal} 
              color="bg-emerald-500" 
              onPress={() => navigation.navigate('Dev')}
            />
             <DashboardCard 
              title="Projects" 
              subtitle="Manage files" 
              icon={Layout} 
              color="bg-orange-500" 
            />
             <DashboardCard 
              title="Optimize" 
              subtitle="Clean system" 
              icon={Zap} 
              color="bg-pink-500" 
            />
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}


4. Chat Screen

File: src/screens/ChatScreen.tsx
Description: AI Agent interface with modern bubbles, floating input bar, and file attachment support.

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useApp } from '../context/AppContext';
import { Send, Paperclip, Plus, History, Zap, X } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';

export default function ChatScreen() {
    const { chatHistory, setChatHistory, api, activeProject } = useApp();
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; type: string } | null>(null);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (chatHistory.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [chatHistory]);

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isSending) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        setIsSending(true);

        const msg = input; 
        const file = selectedFile;
        
        // Optimistic UI
        setChatHistory((prev: any[]) => [...prev, { role: 'user', content: msg, file: file ? { name: file.name } : undefined }]);
        setInput(''); setSelectedFile(null);

        try {
            await api('/chat/send', 'POST', { message: msg, projectId: activeProject });
        } catch (e) {
            setChatHistory((prev: any[]) => [...prev, { role: 'bot', content: '_Error sending message_ ⚠️' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
            if (!result.canceled && result.assets[0]) {
                setSelectedFile({ 
                    name: result.assets[0].name, 
                    uri: result.assets[0].uri, 
                    type: result.assets[0].mimeType ?? 'application/octet-stream' 
                });
            }
        } catch (e) { console.log(e) }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isUser = item.role === 'user';
        
        if (item.isAction) {
            return (
                <View className="self-center bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20 my-2 flex-row items-center gap-2">
                    <Zap size={10} color="#a78bfa" />
                    <Text className="text-violet-400 text-[10px] font-mono font-bold uppercase tracking-wide">{item.content}</Text>
                </View>
            );
        }

        return (
            <View className={`px-4 py-3 rounded-2xl max-w-[88%] mb-3 shadow-sm ${
                isUser ? 'bg-violet-600 self-end rounded-br-sm' : 'bg-neutral-900 border border-neutral-800 self-start rounded-bl-sm'
            }`}>
                <Markdown style={{
                    body: { color: isUser ? '#fff' : '#e5e5e5', fontSize: 14 },
                    code_block: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8 }
                }}>
                    {item.content}
                </Markdown>
                {item.file && (
                    <View className="mt-2 pt-2 border-t border-white/20">
                        <Text className="text-xs text-white/80">📎 {item.file.name}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScreenWrapper style="px-0 pt-0 pb-0">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-900">
                <TouchableOpacity className="p-2.5 bg-neutral-900 rounded-full">
                    <History size={18} color="#a3a3a3" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-white font-bold text-xs tracking-widest">GEMINI AGENT</Text>
                    <Text className="text-neutral-500 text-[9px] uppercase font-bold mt-0.5">Connected</Text>
                </View>
                <TouchableOpacity className="p-2.5 bg-neutral-900 rounded-full">
                    <Plus size={18} color="#a3a3a3" />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={chatHistory}
                renderItem={renderMessage}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            />

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View className="p-4 bg-neutral-950 border-t border-neutral-900">
                    {selectedFile && (
                         <View className="mb-2 p-2 bg-neutral-800 rounded-lg flex-row justify-between items-center">
                             <Text className="text-white text-xs ml-2">📎 {selectedFile.name}</Text>
                             <TouchableOpacity onPress={() => setSelectedFile(null)}><X size={14} color="white"/></TouchableOpacity>
                         </View>
                    )}
                    <View className="flex-row items-end bg-neutral-900 border border-neutral-800 rounded-[28px] p-1.5">
                        <TouchableOpacity onPress={handleFilePick} className="p-2.5 rounded-full">
                            <Paperclip size={20} color="#737373" />
                        </TouchableOpacity>
                        
                        <TextInput
                            className="flex-1 text-white text-sm py-3 px-1 max-h-24"
                            placeholder="Ask agent..."
                            placeholderTextColor="#525252"
                            multiline
                            value={input}
                            onChangeText={setInput}
                        />

                        <TouchableOpacity 
                            onPress={handleSend}
                            disabled={!input && !selectedFile}
                            className={`p-2.5 rounded-full ${input || selectedFile ? 'bg-violet-600 shadow-lg' : 'bg-neutral-800'}`}
                        >
                            <Send size={18} color={input || selectedFile ? 'white' : '#525252'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}


5. Developer Console

File: src/screens/DevScreen.tsx
Description: Terminal view with Start/Stop controls and live logs. Includes a functional Project Selector Modal.

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play, Square, ExternalLink, ChevronDown, Folder, Terminal, X } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';

export default function DevScreen() {
    const { terminalOutput, projects, activeProject, setActiveProject, isConnected } = useApp();
    const [isRunning, setIsRunning] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (terminalOutput.length > 0) flatListRef.current?.scrollToEnd({ animated: true });
    }, [terminalOutput]);

    const activeProj = projects.find(p => p.id === activeProject);

    const handleSelectProject = (projectId: string) => {
        setActiveProject(projectId);
        setShowProjectSelector(false);
        Haptics.selectionAsync();
    };

    return (
        <ScreenWrapper style="px-4 pt-6 pb-2">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6 px-2">
                <View className="flex-row items-center gap-2">
                    <Terminal size={18} color="#a3a3a3" />
                    <Text className="text-white font-bold text-lg tracking-tight">Dev Console</Text>
                </View>
                <View className={`px-2.5 py-0.5 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <Text className={`text-[10px] font-bold tracking-wider ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isConnected ? 'ONLINE' : 'OFFLINE'}
                    </Text>
                </View>
            </View>

            {/* Project Card */}
            <TouchableOpacity 
                onPress={() => {
                    Haptics.selectionAsync();
                    setShowProjectSelector(true);
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 flex-row justify-between items-center active:bg-neutral-800"
            >
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-violet-500/10 rounded-xl items-center justify-center mr-3">
                        <Folder size={20} color="#8b5cf6" />
                    </View>
                    <View>
                        <Text className="text-neutral-500 text-[10px] font-bold tracking-wider uppercase">Target Project</Text>
                        <Text className="text-white font-bold text-sm">{activeProj?.name || 'Select Project'}</Text>
                    </View>
                </View>
                <ChevronDown size={20} color="#525252" />
            </TouchableOpacity>

            {/* Project Selector Modal */}
            <Modal
                visible={showProjectSelector}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProjectSelector(false)}
            >
                <View className="flex-1 bg-black/80 justify-center px-6">
                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden max-h-[50%]">
                        <View className="flex-row justify-between items-center p-5 border-b border-neutral-800">
                            <Text className="text-white font-bold text-lg">Select Project</Text>
                            <TouchableOpacity onPress={() => setShowProjectSelector(false)}>
                                <X size={20} color="#737373" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={projects}
                            keyExtractor={item => item.id}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    onPress={() => handleSelectProject(item.id)}
                                    className={`p-4 rounded-xl mb-2 flex-row items-center ${activeProject === item.id ? 'bg-violet-600' : 'bg-neutral-800'}`}
                                >
                                    <Folder size={18} color={activeProject === item.id ? 'white' : '#a3a3a3'} />
                                    <Text className={`ml-3 font-bold ${activeProject === item.id ? 'text-white' : 'text-neutral-400'}`}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text className="text-neutral-500 text-center py-4">No projects found. Check configuration.</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Controls */}
            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity 
                    onPress={() => setIsRunning(!isRunning)}
                    className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
                        isRunning ? 'bg-neutral-900 opacity-50' : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                >
                    <Play size={16} color="#10b981" fill="#10b981" />
                    <Text className="text-emerald-500 font-bold text-xs tracking-wider">START</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                     onPress={() => setIsRunning(!isRunning)}
                     className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
                        !isRunning ? 'bg-neutral-900 opacity-50' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                >
                    <Square size={16} color="#ef4444" fill="#ef4444" />
                    <Text className="text-red-500 font-bold text-xs tracking-wider">STOP</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-12 items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl">
                    <ExternalLink size={18} color="#a3a3a3" />
                </TouchableOpacity>
            </View>

            {/* Terminal Window */}
            <View className="flex-1 bg-[#0d0d0d] rounded-t-3xl border-t border-x border-neutral-800 overflow-hidden">
                <View className="bg-[#171717] px-4 py-2.5 flex-row justify-between items-center border-b border-black">
                    <View className="flex-row gap-2">
                        <View className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <View className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <View className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </View>
                    <Text className="text-neutral-500 text-[10px] font-mono">bash — 80x24</Text>
                    <Text className="text-[9px] font-bold text-neutral-500">CLEAR</Text>
                </View>
                
                <FlatList
                    ref={flatListRef}
                    data={terminalOutput}
                    keyExtractor={(_, i) => i.toString()}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <Text className={`font-mono text-xs mb-1 ${item.isError ? 'text-red-400' : 'text-neutral-400'}`}>
                            <Text className="opacity-50">$ </Text>
                            {item.line}
                        </Text>
                    )}
                />
            </View>
        </ScreenWrapper>
    );
}


6. Settings Screen

File: src/screens/SettingsScreen.tsx
Description: Configuration screen with functional inputs and state persistence.

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Settings, Server, Key, Folder, Save, CheckCircle2 } from 'lucide-react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useApp } from '../context/AppContext';

const Field = ({ label, icon: Icon, placeholder, secure, hint, value, onChangeText }: any) => (
  <View className="mb-6">
    <View className="flex-row items-center mb-2 ml-1 gap-2">
      <Icon size={12} color="#737373" />
      <Text className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</Text>
    </View>
    <TextInput 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-sm"
      placeholder={placeholder}
      placeholderTextColor="#404040"
      secureTextEntry={secure}
      value={value}
      onChangeText={onChangeText}
    />
    {hint && <Text className="text-neutral-600 text-[10px] ml-1 mt-1.5 italic">{hint}</Text>}
  </View>
);

export default function SettingsScreen() {
  const { config, saveConfig, serverHost, setServerHost } = useApp();
  const [saved, setSaved] = useState(false);
  const [localConfig, setLocalConfig] = useState({
      geminiKey: config.geminiKey,
      authToken: config.authToken,
      workspacePath: config.workspacePath,
  });
  const [localServerHost, setLocalServerHost] = useState(serverHost);

  useEffect(() => {
      setLocalConfig({
          geminiKey: config.geminiKey,
          authToken: config.authToken,
          workspacePath: config.workspacePath,
      });
      setLocalServerHost(serverHost);
  }, [config, serverHost]);

  const handleSave = async () => {
    const success = await saveConfig({
        geminiKey: localConfig.geminiKey,
        authToken: localConfig.authToken,
        workspacePath: localConfig.workspacePath,
        serverHost: localServerHost
    });

    if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <ScreenWrapper style="px-6 pt-6 pb-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center mb-8">
          <View className="w-12 h-12 bg-neutral-900 rounded-2xl items-center justify-center border border-neutral-800">
            <Settings size={24} color="white" />
          </View>
          <View className="ml-4">
            <Text className="text-white text-2xl font-bold">Settings</Text>
            <Text className="text-neutral-500 text-xs">System Configuration</Text>
          </View>
        </View>

        <View>
          <Field 
            label="Server Address" 
            icon={Server} 
            placeholder="192.168.1.100:8787" 
            hint="Local network IP address"
            value={localServerHost}
            onChangeText={(t: string) => setLocalServerHost(t)}
          />
          <Field 
            label="Gemini API Key" 
            icon={Key} 
            placeholder="AIzaSy..." 
            secure 
            hint="Required for Agent functionality"
            value={localConfig.geminiKey}
            onChangeText={(t: string) => setLocalConfig(prev => ({ ...prev, geminiKey: t }))}
          />
          <Field 
            label="Workspace Path" 
            icon={Folder} 
            placeholder="/Users/name/Projects" 
            value={localConfig.workspacePath}
            onChangeText={(t: string) => setLocalConfig(prev => ({ ...prev, workspacePath: t }))}
          />
        </View>

        <TouchableOpacity 
          onPress={handleSave}
          className={`w-full flex-row items-center justify-center py-4 rounded-xl mt-4 ${saved ? 'bg-emerald-600' : 'bg-violet-600'}`}
        >
          {saved ? (
            <>
              <CheckCircle2 size={18} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-sm tracking-widest">SAVED</Text>
            </>
          ) : (
            <>
              <Save size={18} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-sm tracking-widest">SAVE CONFIG</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="mt-8 p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl">
          <Text className="text-[10px] text-violet-300 leading-relaxed">
            <Text className="font-bold uppercase">Note:</Text> Antigravity is currently in Beta. Ensure your helper server is running version 0.8.0 or higher.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}


7. Tab Navigator

File: src/navigation/TabNavigator.tsx
Description: Floating bottom navigation bar with no border tops for a seamless look.

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, Terminal, Settings } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import DevScreen from '../screens/DevScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a', // neutral-950
          borderTopColor: '#171717', // neutral-900
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#8b5cf6', // violet-500
        tabBarInactiveTintColor: '#525252', // neutral-600
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <MessageSquare color={color} size={24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Dev" 
        component={DevScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <Terminal color={color} size={24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <Settings color={color} size={24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
    </Tab.Navigator>
  );
}
