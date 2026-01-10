import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { storage } from '../utils/storage';

interface Config {
    geminiKey: string;
    authToken: string;
    workspacePath: string;
    serverHost: string;
}

interface Project {
    id: string;
    name: string;
    path: string;
}

interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
    isAction?: boolean;
    file?: { name: string };
}

interface SavedChat {
    id: string;
    title: string;
    updatedAt: string;
    history: any[];
}

interface TerminalLine {
    line: string;
    isError: boolean;
}

interface AppContextType {
    token: string;
    setToken: (token: string) => void;
    isConnected: boolean;
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    activeProject: string | null;
    setActiveProject: (id: string | null) => void;
    chatHistory: ChatMessage[];
    setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    newChat: () => Promise<void>;
    savedChats: SavedChat[];
    setSavedChats: (chats: SavedChat[]) => void;
    loadChat: (chatId: string) => Promise<boolean>;
    terminalOutput: TerminalLine[];
    clearTerminal: () => void;
    config: Config;
    setConfig: (config: Config) => void;
    saveConfig: (newConfig: Partial<Config>) => Promise<boolean>;
    api: <T>(path: string, method?: string, body?: any) => Promise<T | null>;
    ws: WebSocket | null;
    serverHost: string;
    setServerHost: (host: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [token, setTokenState] = useState('');
    const [serverHost, setServerHostState] = useState('localhost:8787');
    const [isConnected, setIsConnected] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [config, setConfig] = useState<Config>({
        geminiKey: '',
        authToken: '',
        workspacePath: '',
        serverHost: 'localhost:8787',
    });
    const [savedChats, setSavedChats] = useState<SavedChat[]>([]);

    // Load initial data from storage
    useEffect(() => {
        (async () => {
            const storedToken = await storage.getToken();
            if (storedToken) setTokenState(storedToken);

            const storedHost = await storage.getServerHost();
            setServerHostState(storedHost);

            const storedHistory = await storage.getChatHistory();
            if (storedHistory.length > 0) setChatHistory(storedHistory);
        })();
    }, []);

    // Persist token
    const setToken = async (newToken: string) => {
        setTokenState(newToken);
        if (newToken) {
            await storage.setToken(newToken);
        } else {
            await storage.clearToken();
        }
    };

    // Persist server host
    const setServerHost = async (host: string) => {
        setServerHostState(host);
        await storage.setServerHost(host);
    };

    // WebSocket Connection
    useEffect(() => {
        if (!token || !serverHost) return;

        const protocol = 'ws:'; // React Native uses ws: for local dev
        const socket = new WebSocket(`${protocol}//${serverHost}/ws?token=${token}`);

        socket.onopen = () => {
            setIsConnected(true);
            console.log('WS Connected');
        };

        socket.onclose = () => {
            setIsConnected(false);
            console.log('WS Disconnected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWsMessage(data);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, [token, serverHost]);

    const handleWsMessage = (data: any) => {
        if (data.type === 'chat:token') {
            setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'bot' && !last.isAction) {
                    return [...prev.slice(0, -1), { ...last, content: last.content + data.token }];
                }
                return [...prev, { role: 'bot', content: data.token }];
            });
        } else if (data.type === 'chat:action') {
            setChatHistory(prev => [...prev, { role: 'bot', isAction: true, content: data.action }]);
        } else if (data.type === 'chat:stop') {
            setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'bot' && last.content.includes("Task stopped")) return prev;
                return [...prev, { role: 'bot', content: "_Task stopped by user._ 🛑" }];
            });
        } else if (data.type === 'projects:sync') {
            initData();
        } else if (data.type === 'chats:refresh') {
            api<SavedChat[]>('/chats').then(chats => { if (chats) setSavedChats(chats); });
        } else if (data.type === 'dev:log') {
            setTerminalOutput(prev => [...prev, { line: data.line, isError: data.isError }]);
        }
    };

    const api = async <T,>(path: string, method = 'GET', body: any = null): Promise<T | null> => {
        if (!token) return null;
        try {
            const res = await fetch(`http://${serverHost}/api${path}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : null,
            });
            if (res.status === 401) {
                setToken('');
                return null;
            }
            return await res.json();
        } catch (e) {
            console.error('API Error:', e);
            return null;
        }
    };

    const initData = async () => {
        const prjs = await api<Project[]>('/projects');
        if (prjs) setProjects(prjs);

        const cfg = await api<Config>('/config');
        if (cfg) setConfig({ ...cfg, serverHost });

        const chats = await api<SavedChat[]>('/chats');
        if (chats) setSavedChats(chats);
    };

    useEffect(() => {
        if (token && isConnected) initData();
    }, [token, isConnected]);

    // Persist chat history
    useEffect(() => {
        storage.setChatHistory(chatHistory);
    }, [chatHistory]);

    const newChat = async () => {
        setChatHistory([]);
        await storage.clearChatHistory();
        await api('/chat/clear', 'POST', { projectId: activeProject });
    };

    const clearTerminal = () => setTerminalOutput([]);

    const loadChat = async (chatId: string): Promise<boolean> => {
        const fullChat = await api<SavedChat>('/chats/load', 'POST', { chatId });
        if (fullChat && fullChat.history) {
            setActiveProject(fullChat.id);
            const mappedHistory: ChatMessage[] = fullChat.history.map((part: any) => {
                const firstPart = part.parts?.[0];
                let content = '';
                if (firstPart?.text) {
                    content = firstPart.text;
                } else if (firstPart?.functionCall) {
                    content = `_Called tool: \`${firstPart.functionCall.name}\`_`;
                } else if (firstPart?.functionResponse) {
                    content = `_Tool response from: \`${firstPart.functionResponse.name}\`_`;
                } else {
                    content = '_[Unknown message type]_';
                }
                return {
                    role: part.role === 'user' ? 'user' : 'bot',
                    content,
                } as ChatMessage;
            });
            setChatHistory(mappedHistory);
            return true;
        }
        return false;
    };

    const saveConfig = async (newConfig: Partial<Config>): Promise<boolean> => {
        const res = await api<{ status: string }>('/config', 'POST', newConfig);
        if (res && res.status === 'success') {
            if (newConfig.authToken) setToken(newConfig.authToken);
            if (newConfig.serverHost) setServerHost(newConfig.serverHost);
            const cfg = await api<Config>('/config');
            if (cfg) setConfig({ ...cfg, serverHost });
            return true;
        }
        return false;
    };

    return (
        <AppContext.Provider value={{
            token, setToken,
            isConnected,
            projects, setProjects,
            activeProject, setActiveProject,
            chatHistory, setChatHistory,
            newChat,
            savedChats, setSavedChats,
            loadChat,
            terminalOutput,
            clearTerminal,
            config, setConfig,
            saveConfig,
            api,
            ws,
            serverHost, setServerHost,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
