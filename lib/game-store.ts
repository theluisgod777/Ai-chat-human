'use client';

import { create } from 'zustand';
import type { GameState, GameScreen, Player, Message, SystemLog, PlayerRole } from './game-types';
import { generateId, createSystemLog, SYSTEM_LOG_MESSAGES } from './game-types';

interface GameStore extends GameState {
  // State setters
  setScreen: (screen: GameScreen) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setMyRole: (role: PlayerRole) => void;
  startGame: () => void;
  
  // Messages
  addMessage: (content: string, sender: PlayerRole) => void;
  setMessages: (messages: Message[]) => void;
  
  // System logs
  addSystemLog: (type: SystemLog['type'], message: string) => void;
  addRandomProcessingLogs: () => void;
  
  // Typing
  isOpponentTyping: boolean;
  setOpponentTyping: (typing: boolean) => void;
  
  // My info
  myId: string | null;
  myRole: PlayerRole;
  myName: string;
  setMyId: (id: string) => void;
  setMyName: (name: string) => void;
  
  // Polling
  lastPollTime: number;
  setLastPollTime: (time: number) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  players: [],
  messages: [],
  systemLogs: [],
  isGameStarted: false,
  currentScreen: 'loading' as GameScreen,
  isOpponentTyping: false,
  myId: null,
  myRole: null as PlayerRole,
  myName: '',
  lastPollTime: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  
  setScreen: (screen) => set({ currentScreen: screen }),
  
  setPlayers: (players) => set({ players }),
  
  addPlayer: (player) => set((state) => ({
    players: [...state.players.filter(p => p.id !== player.id), player],
  })),
  
  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId),
  })),
  
  setMyRole: (role) => set({ myRole: role }),
  
  startGame: () => set({ isGameStarted: true, currentScreen: 'chat' }),
  
  addMessage: (content, sender) => set((state) => ({
    messages: [...state.messages, {
      id: generateId(),
      content,
      sender,
      timestamp: Date.now(),
    }],
  })),
  
  setMessages: (messages) => set((state) => {
    // Merge new messages avoiding duplicates
    const existingIds = new Set(state.messages.map(m => m.id));
    const newMessages = messages.filter(m => !existingIds.has(m.id));
    return {
      messages: [...state.messages, ...newMessages],
    };
  }),
  
  addSystemLog: (type, message) => set((state) => ({
    systemLogs: [...state.systemLogs.slice(-50), createSystemLog(type, message)],
  })),
  
  addRandomProcessingLogs: () => {
    const { addSystemLog } = get();
    const processingMessages = SYSTEM_LOG_MESSAGES.AI_PROCESSING;
    const randomMessages = processingMessages
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    randomMessages.forEach((msg, i) => {
      setTimeout(() => addSystemLog('PROC', msg), i * 500);
    });
  },
  
  isOpponentTyping: false,
  setOpponentTyping: (typing) => set({ isOpponentTyping: typing }),
  
  myId: null,
  myRole: null,
  myName: '',
  setMyId: (id) => set({ myId: id }),
  setMyName: (name) => set({ myName: name }),
  
  lastPollTime: 0,
  setLastPollTime: (time) => set({ lastPollTime: time }),
  
  reset: () => set(initialState),
}));

// API helpers
export async function joinGame(name: string) {
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'join', name }),
  });
  return response.json();
}

export async function sendMessage(playerId: string, content: string) {
  const response = await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'message', playerId, content }),
  });
  return response.json();
}

export async function setTyping(playerId: string, isTyping: boolean) {
  await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      action: isTyping ? 'typing' : 'stopTyping', 
      playerId 
    }),
  });
}

export async function leaveGame(playerId: string) {
  await fetch('/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'leave', playerId }),
  });
}

export async function pollGameState(playerId: string | null, since: number = 0) {
  const params = new URLSearchParams();
  if (playerId) params.set('playerId', playerId);
  params.set('since', since.toString());
  
  const response = await fetch(`/api/game?${params}`);
  return response.json();
}
