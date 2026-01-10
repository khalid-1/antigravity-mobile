import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play, Square, Trash2, ChevronDown, Folder, Terminal, X, Check } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';

export default function DevScreen() {
    const { terminalOutput, projects, activeProject, setActiveProject, isConnected, api, clearTerminal } = useApp();
    const [isRunning, setIsRunning] = useState(false);
    const [showProjectSelector, setShowProjectSelector] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const handleToggleProject = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (!activeProject) return;

        const endpoint = isRunning ? '/project/stop' : '/project/start';
        setIsRunning(!isRunning);

        try {
            await api(endpoint, 'POST', { projectId: activeProject });
        } catch (e) {
            setIsRunning(!isRunning);
            console.error("Failed to toggle project", e);
        }
    };

    useEffect(() => {
        if (terminalOutput.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [terminalOutput]);

    const activeProj = projects.find(p => p.id === activeProject);

    const handleSelectProject = (projectId: string) => {
        setActiveProject(projectId);
        setShowProjectSelector(false);
        Haptics.selectionAsync();
    };

    const handleClearTerminal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        clearTerminal();
    };

    return (
        <ScreenWrapper style="px-4 pt-6 pb-0">
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
            <Modal visible={showProjectSelector} transparent={true} animationType="fade">
                <TouchableOpacity activeOpacity={1} onPress={() => setShowProjectSelector(false)} className="flex-1 bg-black/80 justify-center px-6">
                    <View className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                        <View className="flex-row justify-between items-center p-5 border-b border-neutral-800">
                            <Text className="text-white font-bold text-lg">Select Project</Text>
                            <TouchableOpacity onPress={() => setShowProjectSelector(false)}>
                                <X size={20} color="#737373" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="max-h-80 p-4">
                            {projects.map(item => (
                                <TouchableOpacity 
                                    key={item.id}
                                    onPress={() => handleSelectProject(item.id)}
                                    className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${activeProject === item.id ? 'bg-violet-600' : 'bg-neutral-800'}`}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <Folder size={18} color={activeProject === item.id ? 'white' : '#a3a3a3'} />
                                        <Text className={`font-bold ${activeProject === item.id ? 'text-white' : 'text-neutral-400'}`}>
                                            {item.name}
                                        </Text>
                                    </View>
                                    {activeProject === item.id && <Check size={16} color="white" />}
                                </TouchableOpacity>
                            ))}
                            {projects.length === 0 && (
                                <Text className="text-neutral-500 text-center py-4">No projects found. Check configuration.</Text>
                            )}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Controls */}
            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity 
                    onPress={handleToggleProject}
                    disabled={isRunning || !activeProject}
                    className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
                        isRunning || !activeProject ? 'bg-neutral-900 opacity-50' : 'bg-emerald-500/10 border border-emerald-500/20'
                    }`}
                >
                    <Play size={16} color="#10b981" fill={isRunning ? 'transparent' : "#10b981"} />
                    <Text className={`font-bold text-xs tracking-wider ${isRunning || !activeProject ? 'text-neutral-600' : 'text-emerald-500'}`}>START</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                     onPress={handleToggleProject}
                     disabled={!isRunning}
                     className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl gap-2 ${
                        !isRunning ? 'bg-neutral-900 opacity-50' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                >
                    <Square size={16} color="#ef4444" fill={!isRunning ? 'transparent' : "#ef4444"} />
                    <Text className={`font-bold text-xs tracking-wider ${!isRunning ? 'text-neutral-600' : 'text-red-500'}`}>STOP</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleClearTerminal}
                    className="w-12 items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl"
                >
                    <Trash2 size={18} color="#a3a3a3" />
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
                    <View className="w-10" />
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
                    ListEmptyComponent={
                        <Text className="text-neutral-700 font-mono text-xs italic">Terminal output will appear here...</Text>
                    }
                />
            </View>
        </ScreenWrapper>
    );
}
