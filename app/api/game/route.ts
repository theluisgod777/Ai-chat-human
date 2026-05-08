import { NextResponse } from 'next/server';
import type { Player, PlayerRole, Message } from '@/lib/game-types';
import { generateId } from '@/lib/game-types';

// In-memory game state (Note: in production, use Redis or a database)
interface GameState {
  players: Map<string, Player>;
  messages: Message[];
  isGameStarted: boolean;
  typingPlayers: Set<string>;
  lastUpdate: number;
}

// Global state
const gameState: GameState = {
  players: new Map(),
  messages: [],
  isGameStarted: false,
  typingPlayers: new Set(),
  lastUpdate: Date.now(),
};

// Clean up disconnected players (older than 10 seconds without activity)
function cleanupPlayers() {
  const now = Date.now();
  const TIMEOUT = 10000; // 10 seconds
  
  for (const [id, player] of gameState.players) {
    if (now - (player as Player & { lastSeen?: number }).lastSeen! > TIMEOUT) {
      gameState.players.delete(id);
      gameState.typingPlayers.delete(id);
    }
  }
  
  // Reset game if not enough players
  if (gameState.players.size < 2) {
    gameState.isGameStarted = false;
  }
}

function getNextRole(): PlayerRole {
  cleanupPlayers();
  const players = Array.from(gameState.players.values());
  const hasUser = players.some(p => p.role === 'USER');
  const hasAI = players.some(p => p.role === 'AI');
  
  if (!hasUser) return 'USER';
  if (!hasAI) return 'AI';
  return null;
}

// GET: Poll for game state updates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const since = parseInt(searchParams.get('since') || '0', 10);
  
  cleanupPlayers();
  
  // Update player's last seen time
  if (playerId && gameState.players.has(playerId)) {
    const player = gameState.players.get(playerId)!;
    (player as Player & { lastSeen: number }).lastSeen = Date.now();
  }
  
  // Get opponent's typing status
  let isOpponentTyping = false;
  if (playerId) {
    for (const typingId of gameState.typingPlayers) {
      if (typingId !== playerId) {
        isOpponentTyping = true;
        break;
      }
    }
  }
  
  // Only return messages since the last poll
  const newMessages = gameState.messages.filter(m => m.timestamp > since);
  
  return NextResponse.json({
    players: Array.from(gameState.players.values()).map(({ id, name, role, isConnected }) => ({
      id,
      name,
      role,
      isConnected,
    })),
    messages: newMessages,
    isGameStarted: gameState.isGameStarted,
    isOpponentTyping,
    lastUpdate: gameState.lastUpdate,
  });
}

// POST: Perform game actions
export async function POST(request: Request) {
  const body = await request.json();
  const { action, playerId, name, content } = body;
  
  cleanupPlayers();
  
  switch (action) {
    case 'join': {
      const role = getNextRole();
      if (!role) {
        return NextResponse.json({ error: 'Game is full' }, { status: 400 });
      }
      
      const id = generateId();
      const player: Player & { lastSeen: number } = {
        id,
        name: name || `Player ${gameState.players.size + 1}`,
        role,
        isConnected: true,
        lastSeen: Date.now(),
      };
      
      gameState.players.set(id, player);
      gameState.lastUpdate = Date.now();
      
      // Check if game can start
      if (gameState.players.size === 2 && !gameState.isGameStarted) {
        gameState.isGameStarted = true;
      }
      
      return NextResponse.json({
        playerId: id,
        role,
        players: Array.from(gameState.players.values()).map(({ id, name, role, isConnected }) => ({
          id,
          name,
          role,
          isConnected,
        })),
        isGameStarted: gameState.isGameStarted,
      });
    }
    
    case 'message': {
      if (!playerId || !gameState.players.has(playerId)) {
        return NextResponse.json({ error: 'Not in game' }, { status: 400 });
      }
      
      const player = gameState.players.get(playerId)!;
      const message: Message = {
        id: generateId(),
        content: content || '',
        sender: player.role,
        timestamp: Date.now(),
      };
      
      gameState.messages.push(message);
      gameState.lastUpdate = Date.now();
      
      // Stop typing
      gameState.typingPlayers.delete(playerId);
      
      // Keep only last 100 messages
      if (gameState.messages.length > 100) {
        gameState.messages = gameState.messages.slice(-100);
      }
      
      return NextResponse.json({ success: true, message });
    }
    
    case 'typing': {
      if (playerId && gameState.players.has(playerId)) {
        gameState.typingPlayers.add(playerId);
        gameState.lastUpdate = Date.now();
      }
      return NextResponse.json({ success: true });
    }
    
    case 'stopTyping': {
      if (playerId) {
        gameState.typingPlayers.delete(playerId);
        gameState.lastUpdate = Date.now();
      }
      return NextResponse.json({ success: true });
    }
    
    case 'leave': {
      if (playerId) {
        gameState.players.delete(playerId);
        gameState.typingPlayers.delete(playerId);
        gameState.lastUpdate = Date.now();
        
        if (gameState.players.size < 2) {
          gameState.isGameStarted = false;
        }
      }
      return NextResponse.json({ success: true });
    }
    
    case 'reset': {
      // Reset game state (for testing)
      gameState.players.clear();
      gameState.messages = [];
      gameState.isGameStarted = false;
      gameState.typingPlayers.clear();
      gameState.lastUpdate = Date.now();
      return NextResponse.json({ success: true });
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
