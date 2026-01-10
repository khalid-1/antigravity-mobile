# 🚀 Antigravity

**AI-Powered Development Assistant for Mobile**

Antigravity is a powerful mobile application that puts an AI coding agent in your pocket. Control your development environment, chat with an intelligent assistant that can read/write files and run terminal commands, and monitor your projects — all from your phone.

---

## 📱 Features

- **AI Chat Assistant** — Chat with Gemini-powered AI that understands your codebase
- **File Operations** — Agent can read, write, and modify files in your projects
- **Terminal Access** — Run commands and see live output in the Dev Console
- **Project Management** — Switch between multiple projects seamlessly
- **Model Selection** — Choose between Gemini 3 Pro, Gemini 3 Flash, or Gemini 2.0
- **Real-time Sync** — WebSocket connection for instant updates

---

## 🏗️ Project Structure

```
antigravity-mobile/
├── App.tsx                 # Main app entry point
├── src/
│   ├── context/
│   │   └── AppContext.tsx  # Global state & WebSocket management
│   ├── screens/
│   │   ├── AuthScreen.tsx  # Login screen
│   │   ├── HomeScreen.tsx  # Dashboard
│   │   ├── ChatScreen.tsx  # AI Chat interface
│   │   ├── DevScreen.tsx   # Terminal & project controls
│   │   └── SettingsScreen.tsx
│   ├── navigation/
│   │   └── TabNavigator.tsx
│   └── utils/
│       └── storage.ts      # AsyncStorage utilities
├── server/                 # Backend server
│   ├── server.js           # Fastify server with Gemini integration
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 🛠️ Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/antigravity-mobile.git
cd antigravity-mobile
```

### 2. Install Mobile App Dependencies

```bash
npm install
```

### 3. Install Server Dependencies

```bash
cd server
npm install
```

### 4. Configure the Server

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required environment variables:
```env
GEMINI_API_KEY=your_gemini_api_key
AUTH_TOKEN=your_secret_token
WORKSPACE_PATH=/path/to/your/projects
```

### 5. Start the Server

```bash
cd server
node server.js
```

The server will start on `http://localhost:8787`.

### 6. Start the Mobile App

```bash
# In the root directory
npx expo start --clear
```

Press `i` for iOS Simulator or `a` for Android Emulator.

---

## 📲 Connecting from a Physical Device

To use Antigravity on a real phone:

1. **Find your computer's local IP** (e.g., `192.168.1.100`)
2. **Start the server** bound to all interfaces:
   ```bash
   node server.js
   # Server runs on 0.0.0.0:8787 by default
   ```
3. **In the mobile app Settings**, enter your server address: `192.168.1.100:8787`
4. **Enter your AUTH_TOKEN** on the login screen

---

## 🤖 AI Agent Capabilities

The Antigravity agent can:

| Tool | Description |
|------|-------------|
| `list_files` | List files in any directory |
| `read_file` | Read file contents |
| `write_file` | Create or modify files |
| `run_command` | Execute terminal commands |
| `undo_last_write` | Revert the last file change |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List all projects |
| GET | `/api/config` | Get current config |
| POST | `/api/config` | Update config |
| POST | `/api/chat/send` | Send message to AI |
| POST | `/api/chat/stop` | Stop current generation |
| POST | `/api/chat/clear` | Clear chat session |
| GET | `/api/chats` | List saved chats |
| POST | `/api/chats/load` | Load a saved chat |

---

## 🔒 Security Notes

- The `AUTH_TOKEN` is required for all API requests
- Keep your `.env.local` file private (it's gitignored)
- The server should only run on your local network
- Do not expose the server to the public internet

---

## 🧪 Development

### Mobile App (React Native/Expo)

```bash
# Start development server
npx expo start --clear

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Backend Server

```bash
cd server
node server.js

# With auto-restart (using nodemon)
npx nodemon server.js
```

---

## 📝 License

MIT © 2026 Antigravity

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) — AI model powering the agent
- [Expo](https://expo.dev/) — React Native development platform
- [Fastify](https://fastify.io/) — Fast web framework for the backend
