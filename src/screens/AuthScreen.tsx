import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Rocket, Lock, Server } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import ScreenWrapper from '../components/ScreenWrapper';
import * as Haptics from 'expo-haptics';

export default function AuthScreen() {
  const { setToken, serverHost, setServerHost } = useApp();
  const [input, setInput] = useState('');
  const [hostInput, setHostInput] = useState(serverHost);
  const [isLoading, setIsLoading] = useState(false);
  const [showHostConfig, setShowHostConfig] = useState(false);

  const handleLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    // Save host if changed
    if (hostInput !== serverHost) {
        await setServerHost(hostInput);
    }

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
          <Text className="text-4xl font-black text-white tracking-tighter mb-2 italic">ANTIGRAVITY</Text>
          <Text className="text-[#737373] text-xs tracking-[0.2em] uppercase font-bold">Mobile Controller</Text>
        </View>

        {/* Form Section */}
        <View className="space-y-4 gap-4 w-full">
          {showHostConfig && (
              <View className="flex-row items-center bg-[#171717]/80 border border-[#262626] rounded-2xl px-5 py-4 focus:border-violet-500">
                <Server size={20} color="#525252" />
                <TextInput 
                  placeholder="SERVER HOST"
                  placeholderTextColor="#525252"
                  className="flex-1 text-white ml-3 text-base font-medium h-full"
                  value={hostInput}
                  onChangeText={setHostInput}
                  autoCapitalize="none"
                  selectionColor="#8b5cf6"
                />
              </View>
          )}

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
            disabled={isLoading || !input.trim()}
            className={`w-full py-4 rounded-2xl shadow-lg items-center justify-center mt-2 ${input.trim() && !isLoading ? 'bg-violet-600 active:bg-violet-700 shadow-violet-500/20' : 'bg-neutral-800'}`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold tracking-widest text-sm">INITIALIZE UPLINK</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowHostConfig(!showHostConfig)}
            className="items-center mt-4 py-2"
          >
             <Text className="text-[10px] font-bold text-[#525252] uppercase tracking-widest">
                 {showHostConfig ? 'Hide Host Configuration' : 'Configure Server Host'}
             </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
