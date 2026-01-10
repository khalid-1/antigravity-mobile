import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    TOKEN: 'ag_control_token',
    CHAT_HISTORY: 'ag_chat_history_v3',
    SERVER_HOST: 'ag_server_host',
};

export const storage = {
    async getToken(): Promise<string | null> {
        return AsyncStorage.getItem(KEYS.TOKEN);
    },

    async setToken(token: string): Promise<void> {
        await AsyncStorage.setItem(KEYS.TOKEN, token);
    },

    async clearToken(): Promise<void> {
        await AsyncStorage.removeItem(KEYS.TOKEN);
    },

    async getChatHistory(): Promise<any[]> {
        const data = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch {
                return [];
            }
        }
        return [];
    },

    async setChatHistory(history: any[]): Promise<void> {
        await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(history));
    },

    async clearChatHistory(): Promise<void> {
        await AsyncStorage.removeItem(KEYS.CHAT_HISTORY);
    },

    async getServerHost(): Promise<string> {
        const host = await AsyncStorage.getItem(KEYS.SERVER_HOST);
        // Default to localhost for development, user can change in settings
        return host || 'localhost:8787';
    },

    async setServerHost(host: string): Promise<void> {
        await AsyncStorage.setItem(KEYS.SERVER_HOST, host);
    },
};
