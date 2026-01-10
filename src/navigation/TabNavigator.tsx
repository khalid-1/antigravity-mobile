import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, Terminal, User } from 'lucide-react-native';
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
                    tabBarIcon: ({ color, focused }) => <User color={color} size={24} strokeWidth={focused ? 2.5 : 2} />,
                }}
            />
        </Tab.Navigator>
    );
}
