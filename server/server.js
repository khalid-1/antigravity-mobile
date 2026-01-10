const fastify = require('fastify')({ logger: true });
const path = require('path');
const fs = require('fs');
const spawn = require('cross-spawn');
const treeKill = require('tree-kill');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load envs
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log(`Loading .env.local from ${envLocalPath}`);
    const result = require('dotenv').config({ path: envLocalPath });
    if (result.error) {
        console.error("Error loading .env.local:", result.error);
    } else {
        console.log("Loaded envs:", result.parsed);
    }
} else {
    console.log('.env.local not found');
}
require('dotenv').config();

console.log("Token status:", process.env.AG_CONTROL_TOKEN ? "Loaded" : "Missing");
// --- Configuration ---
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 8787;
const AUTH_TOKEN = process.env.AG_CONTROL_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!AUTH_TOKEN) {
    console.warn("WARNING: AG_CONTROL_TOKEN is not set in .env.");
}

// --- LLM Setup ---
let genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
let currentAuthToken = AUTH_TOKEN;
let currentWorkspacePath = process.env.WORKSPACE_PATH || '/Users/khalid/My Apps Data/ANti';

// --- plugins ---
fastify.register(require('@fastify/websocket'));
fastify.register(require('@fastify/cors'), { origin: '*' });
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'frontend/dist'),
    prefix: '/',
});

// SPA Fallback: for any route not found (that isn't /api), serve index.html
fastify.setNotFoundHandler((req, reply) => {
    if (req.raw.url.startsWith('/api')) {
        reply.code(404).send({ error: 'Not Found' });
        return;
    }
    reply.sendFile('index.html');
});

// --- State ---
const activeProcesses = new Map();

// --- Auth Middleware ---
// --- Auth Middleware ---
const verifyAuth = async (request, reply) => {
    // Allow setup if no token is configured on server
    if (!currentAuthToken) return;

    const authHeader = request.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${currentAuthToken}`) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
    }
};

const verifyWsAuth = (conn, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (token !== currentAuthToken) {
        conn.socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
        conn.socket.close();
        return false;
    }
    return true;
};

// --- Helpers ---
function loadProjects() {
    try {
        if (!currentWorkspacePath || !fs.existsSync(currentWorkspacePath)) {
            // Fallback to static file if workspace not set
            if (fs.existsSync(path.join(__dirname, 'projects.json'))) {
                const data = fs.readFileSync(path.join(__dirname, 'projects.json'), 'utf8');
                return JSON.parse(data);
            }
            return [];
        }

        const items = fs.readdirSync(currentWorkspacePath, { withFileTypes: true });
        return items
            .filter(item => item.isDirectory() && !item.name.startsWith('.'))
            .map(item => ({
                id: item.name,
                name: item.name,
                path: path.join(currentWorkspacePath, item.name),
                cmd: 'echo "No specific command configured"', // Default placeholders
                args: []
            }));
    } catch (e) {
        console.error("Error loading projects:", e);
        return [];
    }
}

function broadcast(message) {
    fastify.websocketServer.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

// --- Agent Tools ---
const agentTools = {
    list_files: async ({ dir }, projectPath) => {
        const target = path.isAbsolute(dir) ? dir : path.resolve(projectPath, dir);
        if (!target.startsWith(projectPath)) {
            throw new Error(`Access denied: "${dir}" is outside the project boundaries.`);
        }
        if (!fs.existsSync(target)) throw new Error(`Directory not found: ${dir}`);
        const files = fs.readdirSync(target, { withFileTypes: true });
        return files.map(f => ({ name: f.name, isDir: f.isDirectory() }));
    },
    read_file: async ({ file }, projectPath) => {
        const target = path.isAbsolute(file) ? file : path.resolve(projectPath, file);
        if (!target.startsWith(projectPath)) {
            throw new Error(`Access denied: "${file}" is outside the project boundaries.`);
        }
        if (!fs.existsSync(target)) throw new Error(`File not found: ${file}`);
        return fs.readFileSync(target, 'utf8');
    },
    write_file: async ({ file, content }, projectPath) => {
        const target = path.isAbsolute(file) ? file : path.resolve(projectPath, file);
        if (!target.startsWith(projectPath)) {
            throw new Error(`Access denied: "${file}" is outside the project boundaries.`);
        }

        let previousContent = null;
        if (fs.existsSync(target)) {
            previousContent = fs.readFileSync(target, 'utf8');
        }

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);

        return { status: "success", file, previousContent };
    },
    undo_last_write: async ({ projectId }, projectPath) => {
        const history = fileChangeHistory[projectId];
        if (!history || history.length === 0) {
            throw new Error("No change history found to undo.");
        }

        const lastChange = history.pop();
        const target = path.resolve(projectPath, lastChange.file);

        if (lastChange.previousContent === null) {
            // File was created, so undo = delete
            if (fs.existsSync(target)) {
                fs.unlinkSync(target);
                return { status: "success", action: "deleted", file: lastChange.file };
            }
        } else {
            // File was modified, so undo = restore
            fs.writeFileSync(target, lastChange.previousContent);
            return { status: "success", action: "restored", file: lastChange.file };
        }
        return { status: "fail", message: "File already in target state or missing." };
    },
    run_command: async ({ cmd, args }, projectPath) => {
        return new Promise((resolve) => {
            const child = spawn(cmd, args || [], { cwd: projectPath, shell: true });
            let output = '';
            child.stdout.on('data', d => {
                output += d.toString();
                broadcast({ type: 'dev:log', projectId: 'agent', line: d.toString() });
            });
            child.stderr.on('data', d => {
                output += d.toString();
                broadcast({ type: 'dev:log', projectId: 'agent', line: d.toString(), isError: true });
            });
            child.on('close', code => resolve({ output, code }));
        });
    }
};

const toolSpecs = [
    { name: "list_files", description: "List files in a directory", parameters: { type: "object", properties: { dir: { type: "string" } }, required: ["dir"] } },
    { name: "read_file", description: "Read a file", parameters: { type: "object", properties: { file: { type: "string" } }, required: ["file"] } },
    { name: "write_file", description: "Create or update a file", parameters: { type: "object", properties: { file: { type: "string" }, content: { type: "string" } }, required: ["file", "content"] } },
    { name: "undo_last_write", description: "Revert the most recent file change made by write_file", parameters: { type: "object", properties: { projectId: { type: "string" } }, required: ["projectId"] } },
    { name: "run_command", description: "Run a shell command", parameters: { type: "object", properties: { cmd: { type: "string" }, args: { type: "array", items: { type: "string" } } }, required: ["cmd"] } },
];

// Global state
const chatSessions = {}; // Map<projectId, ChatSession>
const fileChangeHistory = {}; // Map<projectId, Array<{file, timestamp, previousContent}>>
const abortSignals = new Set(); // Set of msgIds to abort

// --- Chat Persistence ---
// Store chats in macOS Application Support folder
const APP_DATA_DIR = path.join(process.env.HOME || '/tmp', 'Library', 'Application Support', 'Antigravity');
if (!fs.existsSync(APP_DATA_DIR)) {
    fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}
const CHATS_FILE = path.join(APP_DATA_DIR, 'chats.json');

function loadAllChats() {
    if (!fs.existsSync(CHATS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveChatToDisk(projectId, chatData) {
    const all = loadAllChats();
    all[projectId] = {
        id: projectId,
        title: chatData.title || `Chat ${new Date().toLocaleString()}`,
        history: chatData.history,
        updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CHATS_FILE, JSON.stringify(all, null, 2));
}

// --- Agent Loop ---
async function runAgentLoop(message, projectId, msgId, modelId, fileData = null) {
    if (!genAI) {
        broadcast({ type: 'chat:token', id: msgId, token: "Error: GEMINI_API_KEY not set in .env" });
        return;
    }

    const projects = loadProjects();
    const project = projects.find(p => p.id === projectId);
    const projectPath = project ? project.path : currentWorkspacePath;

    // Init history
    if (!fileChangeHistory[projectId]) fileChangeHistory[projectId] = [];

    let chatSession = chatSessions[projectId];
    if (!chatSession) {
        // Model Mapping (Cosmetic -> Real)
        let safeModelId = modelId || "gemini-3-flash-preview";

        // Performance fallback: if model is gpt/claude, map to latest flash
        if (modelId?.startsWith('claude') || modelId?.startsWith('gpt')) {
            safeModelId = "gemini-3-flash-preview";
        }

        // Vision Support: Gemini 3 supports vision, but 2.0 Flash is also very stable.
        // We removed 1.5 references as they are considered "very old".
        if (fileData && (safeModelId.includes('1.5') || !safeModelId)) {
            safeModelId = "gemini-2.0-flash-exp";
        }

        console.log(`[AgentLoop] Initializing Session: project: ${projectId}, model: ${safeModelId}`);

        const model = genAI.getGenerativeModel({
            model: safeModelId,
            systemInstruction: `You are Antigravity Remote Agent. You are helping a developer work on a project at path: ${projectPath}. 
            You can use tools to read/write files and run commands. 
            
            HISTORY OF FILE CHANGES (for context):
            ${JSON.stringify(fileChangeHistory[projectId]?.map(h => ({ file: h.file, timestamp: h.timestamp })) || [])}

            Think step by step. Use the tools provided to explore and implement the user request.
            If the user asks to UNDO or REVERT, immediately call 'undo_last_write' with the current projectId.
            Always explain what you are doing.`
        });

        chatSession = model.startChat({
            tools: [{ functionDeclarations: toolSpecs }],
            history: [],
            generationConfig: { maxOutputTokens: 8000 }
        });
        chatSessions[projectId] = chatSession;
    }

    // Track history locally for persistence (don't rely on getHistory() API)
    let localHistory = [];

    try {
        console.log(`[AgentLoop] Sending Message: msgId: ${msgId}`);
        const parts = [message || "Describe or analyze the attached context/image."];
        if (fileData) {
            console.log(`[AgentLoop] File attached: ${fileData.mimeType}, size: ${Math.round(fileData.base64.length / 1.33)} bytes`);
            parts.push({
                inlineData: {
                    data: fileData.base64,
                    mimeType: fileData.mimeType
                }
            });
        }

        // Save user message to local history
        localHistory.push({ role: 'user', parts: [{ text: message }] });

        if (abortSignals.has(msgId)) return;
        let result = await chatSession.sendMessage(parts);
        let response = result.response;

        while (true) {
            if (abortSignals.has(msgId)) {
                broadcast({ type: 'chat:token', id: msgId, token: "\n\n[Agent Stopped]" });
                break;
            }

            // Broadcast text if present
            const text = response.text();
            if (text) {
                broadcast({ type: 'chat:token', id: msgId, token: text });
                // Save model response to local history
                localHistory.push({ role: 'model', parts: [{ text }] });
            }

            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) break;

            const parts = candidates[0].content.parts;
            if (!parts) break;

            const calls = parts.filter(p => p.functionCall);
            if (calls.length === 0) break;

            const toolResponses = [];
            for (const call of calls) {
                if (abortSignals.has(msgId)) break;

                const { name, args } = call.functionCall;
                broadcast({ type: 'chat:action', id: msgId, action: name });

                try {
                    const output = await agentTools[name](args, projectPath);

                    // Log file changes for Undo context
                    if (name === 'write_file') {
                        if (!fileChangeHistory[projectId]) fileChangeHistory[projectId] = [];
                        fileChangeHistory[projectId].push({
                            file: args.file,
                            timestamp: new Date().toISOString(),
                            previousContent: output.previousContent
                        });
                        // Keep history manageable: last 10 changes
                        if (fileChangeHistory[projectId].length > 10) {
                            fileChangeHistory[projectId].shift();
                        }
                    }

                    // For tool response, we must follow the API format
                    // toolResponses must be Array<Part>
                    toolResponses.push({
                        functionResponse: {
                            name,
                            response: { name, content: output }
                        }
                    });
                } catch (err) {
                    toolResponses.push({
                        functionResponse: {
                            name,
                            response: { name, content: { error: err.message } }
                        }
                    });
                }
            }

            if (abortSignals.has(msgId) || toolResponses.length === 0) break;

            result = await chatSession.sendMessage(toolResponses);
            response = result.response;
        }

    } catch (err) {
        let msg = `\nError: ${err.message}`;
        if (msg.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
            msg = "\n**Error: API Key Restriction Detected**\n" +
                "Your API key is restricted to specific websites, but this agent runs as a backend service (no referrer).\n\n" +
                "**Fix:**\n" +
                "1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)\n" +
                "2. Click your API Key.\n" +
                "3. Set 'Application restrictions' to 'None'.\n" +
                "4. Save and try again.";
        }
        broadcast({ type: 'chat:token', id: msgId, token: msg });
        // Save error to local history
        localHistory.push({ role: 'model', parts: [{ text: msg }] });
    } finally {
        abortSignals.delete(msgId);
        // Signal that agent is done thinking
        broadcast({ type: 'chat:done', id: msgId, projectId });
        // Persistence: Save LOCAL history to disk (no API call needed)
        if (localHistory.length > 0) {
            try {
                saveChatToDisk(projectId, {
                    title: message?.substring(0, 40) || "New Conversation",
                    history: localHistory
                });
                console.log(`[Persistence] Saved ${localHistory.length} messages to disk.`);
                // Notify clients to refresh their chat list
                broadcast({ type: 'chats:refresh' });
            } catch (perr) {
                console.error("[Persistence Error]", perr);
            }
        }
    }
}

// --- Routes ---
fastify.get('/api/health', { preHandler: verifyAuth }, async () => ({ status: 'ok' }));
fastify.get('/api/projects', { preHandler: verifyAuth }, async () => loadProjects());
fastify.get('/api/dev/status', { preHandler: verifyAuth }, async () => {
    const list = [];
    activeProcesses.forEach((v, k) => {
        list.push({ id: k, status: v.status });
    });
    return list;
});

fastify.post('/api/dev/start', { preHandler: verifyAuth }, async (req, reply) => {
    const { id } = req.body;
    const project = loadProjects().find(p => p.id === id);
    if (!project) return reply.code(404).send({ error: 'Not found' });

    const child = spawn(project.cmd, project.args || [], { cwd: project.path });
    activeProcesses.set(id, { process: child, status: 'running' });
    broadcast({ type: 'dev:started', projectId: id });

    child.stdout.on('data', d => broadcast({ type: 'dev:log', projectId: id, line: d.toString() }));
    child.stderr.on('data', d => broadcast({ type: 'dev:log', projectId: id, line: d.toString(), isError: true }));
    child.on('close', () => {
        activeProcesses.set(id, { status: 'stopped' });
        broadcast({ type: 'dev:stopped', projectId: id });
    });
    return { status: 'started' };
});

fastify.post('/api/dev/stop', { preHandler: verifyAuth }, async (req) => {
    const { id } = req.body;
    const info = activeProcesses.get(id);
    if (info && info.process) {
        treeKill(info.process.pid, 'SIGKILL');
        activeProcesses.set(id, { status: 'stopped' });
        broadcast({ type: 'dev:stopped', projectId: id });
    }
    return { status: 'stopping' };
});

fastify.post('/api/chat/send', { preHandler: verifyAuth }, async (req) => {
    const { message, projectId, modelId, fileData } = req.body;
    const msgId = Date.now().toString();
    runAgentLoop(message, projectId, msgId, modelId, fileData);
    return { id: msgId };
});

fastify.post('/api/chat/stop', { preHandler: verifyAuth }, async (req) => {
    const { projectId } = req.body;
    if (projectId) {
        delete chatSessions[projectId];
    }
    // Signal all currently running loops to stop
    // Global abort for now as we don't track msgIds per request elsewhere
    // but the Set will clear as loops finish or abort.
    // To be safer, we'd need to store active msgIds in a project-mapped set.
    // For now, this global broadcast + session clear is a strong "STOP EVERYTHING"
    broadcast({ type: 'chat:stop', projectId });
    return { status: 'stopped' };
});

fastify.post('/api/chat/clear', { preHandler: verifyAuth }, async (req) => {
    const { projectId } = req.body;
    // Only clear in-memory session, NOT the persisted history on disk
    // Users can delete individual chats via the trash icon (DELETE /api/chats/:id)
    if (projectId) {
        delete chatSessions[projectId];
        delete fileChangeHistory[projectId];
    } else {
        Object.keys(chatSessions).forEach(k => delete chatSessions[k]);
        Object.keys(fileChangeHistory).forEach(k => delete fileChangeHistory[k]);
    }
    return { status: 'cleared' };
});

// Settings Endpoints
fastify.get('/api/config', { preHandler: verifyAuth }, async () => {
    return {
        geminiKey: process.env.GEMINI_API_KEY || '',
        authToken: process.env.AG_CONTROL_TOKEN || '',
        workspacePath: currentWorkspacePath
    };
});

fastify.post('/api/config', { preHandler: verifyAuth }, async (req) => {
    const { geminiKey, authToken, workspacePath } = req.body;
    const envPath = path.join(__dirname, '.env.local');

    // Read existing content or default to empty
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    let lines = content.split('\n');

    // Helper to update a key safely
    const updateKey = (key, value) => {
        if (!value) return; // Don't update if empty/undefined
        const cleanValue = value.trim();
        let found = false;
        lines = lines.map(line => {
            if (line.startsWith(`${key}=`)) {
                found = true;
                return `${key}=${cleanValue}`;
            }
            return line;
        });
        if (!found) {
            lines.push(`${key}=${cleanValue}`);
        }
    };

    if (geminiKey) {
        updateKey('GEMINI_API_KEY', geminiKey);
        process.env.GEMINI_API_KEY = geminiKey.trim();
        // Re-init GenAI
        try {
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            console.log("Re-initialized Gemini with new key.");
        } catch (e) {
            console.error("Failed to re-init Gemini:", e);
        }
    }
    if (authToken) {
        updateKey('AG_CONTROL_TOKEN', authToken);
        process.env.AG_CONTROL_TOKEN = authToken.trim();
        currentAuthToken = authToken.trim();
    }
    if (workspacePath) {
        updateKey('WORKSPACE_PATH', workspacePath);
        process.env.WORKSPACE_PATH = workspacePath.trim();
        currentWorkspacePath = workspacePath.trim();
        // Trigger project refresh
        broadcast({ type: 'projects:sync' });
    }

    // Filter out empty lines to keep it clean and join
    const newContent = lines.filter(l => l.trim() !== '').join('\n');
    fs.writeFileSync(envPath, newContent);
    console.log("Configuration updated and saved to .env.local");
    return { status: 'success' };
});


// --- Chat History Routes ---
fastify.get('/api/chats', { preHandler: verifyAuth }, async () => {
    const chats = loadAllChats();
    return Object.values(chats).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
});

fastify.post('/api/chats/load', { preHandler: verifyAuth }, async (req) => {
    const { chatId } = req.body;
    const chats = loadAllChats();
    const chat = chats[chatId];
    if (chat) return chat;
    return { error: 'Chat not found' };
});

fastify.delete('/api/chats/:id', { preHandler: verifyAuth }, async (req) => {
    const { id } = req.params;
    const chats = loadAllChats();
    delete chats[id];
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
    return { status: 'deleted' };
});

fastify.register(async (f) => {
    f.get('/ws', { websocket: true }, (conn, req) => {
        if (!verifyWsAuth(conn, req)) return;
        conn.socket.on('message', () => { });
    });
});

fastify.listen({ port: PORT, host: HOST }).then(() => console.log(`Server at http://${HOST}:${PORT}`));
