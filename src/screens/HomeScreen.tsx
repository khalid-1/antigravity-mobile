import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Activity, Layout, User, Terminal, MessageSquare, Zap } from 'lucide-react-native';
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Settings');
            }}
            className="w-10 h-10 bg-neutral-800 rounded-full items-center justify-center border border-neutral-700"
          >
            <User size={20} color="white" />
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
