import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { Player, PlayerRole, Message } from '@/lib/game-types';
import { generateId } from '@/lib/game-types';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Redis keys
const GAME_KEY = 'game:state';
const PLAYERS_KEY = 'game:players';
const MESSAGES_KEY = 'game:messages';
const TYPING_KEY = 'game:typing';

// Player timeout in seconds
const PLAYER_TIMEOUT = 15;

interface PlayerWithLastSeen extends Player {
  lastSeen: number;
}

// Clean up disconnected players
async function cleanupPlayers(): Promise<void> {
  const now = Date.now();
  const players = await redis.hgetall<Record<string, PlayerWithLastSeen>>(PLAYERS_KEY) || {};
  
  for (const [id, player] of Object.entries(players)) {
    if (player && now - player.lastSeen > PLAYER_TIMEOUT * 1000) {
      await redis.hdel(PLAYERS_KEY, id);
      await redis.srem(TYPING_KEY, id);
    }
  }
  
  // Check player count after cleanup
  const remainingPlayers = await redis.hlen(PLAYERS_KEY);
  if (remainingPlayers < 2) {
    await redis.set(GAME_KEY, JSON.stringify({ isGameStarted: false, lastUpdate: now }));
  }
}

async function getNextRole(): Promise<PlayerRole> {
  await cleanupPlayers();
  const players = await redis.hgetall<Record<string, PlayerWithLastSeen>>(PLAYERS_KEY) || {};
  const playerList = Object.values(players);
  
  const hasUser = playerList.some(p => p?.role === 'USER');
  const hasAI = playerList.some(p => p?.role === 'AI');
  
  if (!hasUser) return 'USER';
  if (!hasAI) return 'AI';
  return null;
}

async function getGameState(): Promise<{ isGameStarted: boolean; lastUpdate: number }> {
  const state = await redis.get<{ isGameStarted: boolean; lastUpdate: number }>(GAME_KEY);
  return state || { isGameStarted: false, lastUpdate: Date.now() };
}

// GET: Poll for game state updates
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const since = parseInt(searchParams.get('since') || '0', 10);
  
  await cleanupPlayers();
  
  // Update player's last seen time
  if (playerId) {
    const player = await redis.hget<PlayerWithLastSeen>(PLAYERS_KEY, playerId);
    if (player) {
      player.lastSeen = Date.now();
      await redis.hset(PLAYERS_KEY, { [playerId]: player });
    }
  }
  
  // Get all players
  const players = await redis.hgetall<Record<string, PlayerWithLastSeen>>(PLAYERS_KEY) || {};
  const playerList = Object.values(players).filter(Boolean).map(({ id, name, role, isConnected }) => ({
    id,
    name,
    role,
    isConnected,
  }));
  
  // Get typing players
  const typingPlayers = await redis.smembers(TYPING_KEY) || [];
  const isOpponentTyping = playerId ? typingPlayers.some(id => id !== playerId) : false;
  
  // Get messages since last poll
  const allMessages = await redis.lrange<Message>(MESSAGES_KEY, 0, -1) || [];
  const newMessages = allMessages.filter(m => m && m.timestamp > since);
  
  // Get game state
  const gameState = await getGameState();
  
  return NextResponse.json({
    players: playerList,
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
  
  await cleanupPlayers();
  
  switch (action) {
    case 'join': {
      const role = await getNextRole();
      if (!role) {
        return NextResponse.json({ error: 'Game is full' }, { status: 400 });
      }
      
      const id = generateId();
      const player: PlayerWithLastSeen = {
        id,
        name: name || `Player ${(await redis.hlen(PLAYERS_KEY)) + 1}`,
        role,
        isConnected: true,
        lastSeen: Date.now(),
      };
      
      await redis.hset(PLAYERS_KEY, { [id]: player });
      
      // Check if game can start
      const playerCount = await redis.hlen(PLAYERS_KEY);
      const gameState = await getGameState();
      
      if (playerCount === 2 && !gameState.isGameStarted) {
        await redis.set(GAME_KEY, JSON.stringify({ 
          isGameStarted: true, 
          lastUpdate: Date.now() 
        }));
      }
      
      // Get updated state
      const updatedState = await getGameState();
      const players = await redis.hgetall<Record<string, PlayerWithLastSeen>>(PLAYERS_KEY) || {};
      const playerList = Object.values(players).filter(Boolean).map(({ id, name, role, isConnected }) => ({
        id,
        name,
        role,
        isConnected,
      }));
      
      return NextResponse.json({
        playerId: id,
        role,
        players: playerList,
        isGameStarted: updatedState.isGameStarted,
      });
    }
    
    case 'message': {
      if (!playerId) {
        return NextResponse.json({ error: 'Not in game' }, { status: 400 });
      }
      
      const player = await redis.hget<PlayerWithLastSeen>(PLAYERS_KEY, playerId);
      if (!player) {
        return NextResponse.json({ error: 'Not in game' }, { status: 400 });
      }
      
      const message: Message = {
        id: generateId(),
        content: content || '',
        sender: player.role,
        timestamp: Date.now(),
      };
      
      // Add message to list (prepend for easier retrieval)
      await redis.rpush(MESSAGES_KEY, message);
      
      // Keep only last 100 messages
      const messageCount = await redis.llen(MESSAGES_KEY);
      if (messageCount > 100) {
        await redis.ltrim(MESSAGES_KEY, -100, -1);
      }
      
      // Stop typing
      await redis.srem(TYPING_KEY, playerId);
      
      // Update last update time
      await redis.set(GAME_KEY, JSON.stringify({ 
        ...(await getGameState()),
        lastUpdate: Date.now() 
      }));
      
      return NextResponse.json({ success: true, message });
    }
    
    case 'typing': {
      if (playerId) {
        await redis.sadd(TYPING_KEY, playerId);
        // Auto-expire typing status after 5 seconds
        await redis.expire(TYPING_KEY, 5);
      }
      return NextResponse.json({ success: true });
    }
    
    case 'stopTyping': {
      if (playerId) {
        await redis.srem(TYPING_KEY, playerId);
      }
      return NextResponse.json({ success: true });
    }
    
    case 'leave': {
      if (playerId) {
        await redis.hdel(PLAYERS_KEY, playerId);
        await redis.srem(TYPING_KEY, playerId);
        
        const playerCount = await redis.hlen(PLAYERS_KEY);
        if (playerCount < 2) {
          await redis.set(GAME_KEY, JSON.stringify({ 
            isGameStarted: false, 
            lastUpdate: Date.now() 
          }));
        }
      }
      return NextResponse.json({ success: true });
    }
    
    case 'reset': {
      // Reset game state completely
      await redis.del(PLAYERS_KEY);
      await redis.del(MESSAGES_KEY);
      await redis.del(TYPING_KEY);
      await redis.set(GAME_KEY, JSON.stringify({ 
        isGameStarted: false, 
        lastUpdate: Date.now() 
      }));
      return NextResponse.json({ success: true });
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
