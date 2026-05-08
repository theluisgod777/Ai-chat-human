// Game Types and State Management

export type PlayerRole = 'USER' | 'AI' | null;

export type GameScreen = 'loading' | 'lobby' | 'chat';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isConnected: boolean;
}

export interface Message {
  id: string;
  content: string;
  sender: PlayerRole;
  timestamp: number;
}

export interface SystemLog {
  id: string;
  type: 'INFO' | 'PROC' | 'SUCC' | 'WARN' | 'ERR';
  message: string;
  timestamp: number;
}

export interface GameState {
  players: Player[];
  messages: Message[];
  systemLogs: SystemLog[];
  isGameStarted: boolean;
  currentScreen: GameScreen;
}

// Socket Events
export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_GAME: 'join-game',
  SEND_MESSAGE: 'send-message',
  START_TYPING: 'start-typing',
  STOP_TYPING: 'stop-typing',
  
  // Server -> Client
  PLAYER_JOINED: 'player-joined',
  ROLE_ASSIGNED: 'role-assigned',
  GAME_START: 'game-start',
  NEW_MESSAGE: 'new-message',
  OPPONENT_TYPING: 'opponent-typing',
  OPPONENT_STOPPED_TYPING: 'opponent-stopped-typing',
  PLAYER_DISCONNECTED: 'player-disconnected',
  GAME_STATE_UPDATE: 'game-state-update',
} as const;

// System log messages for the fake terminal
export const SYSTEM_LOG_MESSAGES = {
  USER_PROMPT: [
    'Prompt received from USER terminal',
    'Input stream captured',
    'Query registered in processing queue',
  ],
  AI_PROCESSING: [
    'Analyzing sentence structure...',
    'Identifying intent patterns...',
    'Cross-referencing knowledge base...',
    'Generating contextual response...',
    'Optimizing output parameters...',
    'Compiling response matrix...',
  ],
  AI_RESPONSE: [
    'Response compiled successfully',
    'Output validated and sanitized',
    'Transmitting to USER terminal...',
  ],
  CONNECTION: [
    'Neural link established',
    'Secure channel verified',
    'Handshake protocol complete',
  ],
};

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function createSystemLog(type: SystemLog['type'], message: string): SystemLog {
  return {
    id: generateId(),
    type,
    message,
    timestamp: Date.now(),
  };
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
