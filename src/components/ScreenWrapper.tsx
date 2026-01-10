import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({ children, style }: { children: React.ReactNode, style?: string }) {
    return (
        <SafeAreaView className="flex-1 bg-neutral-950" style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
            <View className={`flex-1 ${style}`}>
                {children}
            </View>
        </SafeAreaView>
    );
}
