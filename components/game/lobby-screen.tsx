'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlitchText } from '@/components/effects/glitch-text';
import { Particles } from '@/components/effects/particles';
import { Scanlines } from '@/components/effects/scanlines';
import { useGameStore, joinGame, pollGameState } from '@/lib/game-store';
import type { Player, PlayerRole } from '@/lib/game-types';
import { User, Bot, Wifi, WifiOff, Users } from 'lucide-react';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { 
    players, 
    myRole,
    myId,
    setMyId, 
    setMyRole, 
    setPlayers, 
    addSystemLog,
    startGame,
    lastPollTime,
    setLastPollTime,
  } = useGameStore();
  
  // Polling for game state
  const poll = useCallback(async () => {
    if (!myId) return;
    
    try {
      const data = await pollGameState(myId, lastPollTime);
      setPlayers(data.players);
      setLastPollTime(data.lastUpdate);
      
      // Check if game started
      if (data.isGameStarted && data.players.length >= 2) {
        addSystemLog('SUCC', 'Both players connected. Starting session...');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        setTimeout(() => startGame(), 1500);
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }, [myId, lastPollTime, setPlayers, setLastPollTime, addSystemLog, startGame]);
  
  // Start polling when joined
  useEffect(() => {
    if (hasJoined && myId) {
      // Initial poll
      poll();
      
      // Set up polling interval
      pollIntervalRef.current = setInterval(poll, 1000);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [hasJoined, myId, poll]);
  
  const handleJoin = async () => {
    if (!name.trim()) return;
    
    setIsConnecting(true);
    addSystemLog('INFO', 'Connecting to server...');
    
    try {
      const data = await joinGame(name.trim());
      
      if (data.error) {
        addSystemLog('ERR', data.error);
        setIsConnecting(false);
        return;
      }
      
      setMyId(data.playerId);
      setMyRole(data.role);
      setPlayers(data.players);
      addSystemLog('SUCC', `Role assigned: ${data.role}`);
      setIsConnecting(false);
      setHasJoined(true);
      
      // Check if game started immediately
      if (data.isGameStarted) {
        addSystemLog('SUCC', 'Both players connected. Starting session...');
        setTimeout(() => startGame(), 1500);
      }
    } catch (error) {
      console.error('Join error:', error);
      addSystemLog('ERR', 'Connection failed');
      setIsConnecting(false);
    }
  };
  
  const RoleIcon = myRole === 'USER' ? User : Bot;
  const roleColor = myRole === 'USER' ? 'text-primary' : 'text-secondary';
  const roleBorder = myRole === 'USER' ? 'neon-border-cyan' : 'neon-border-magenta';
  
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Particles count={25} />
      <Scanlines opacity={0.02} />
      
      <div className="relative z-10 w-full max-w-lg mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <GlitchText 
            text="CONNECTION HUB" 
            className="text-3xl md:text-4xl font-bold glow-cyan"
            glitchOnHover
          />
          <p className="text-muted-foreground mt-2 terminal-text text-sm">
            MULTIPLAYER SESSION MANAGEMENT
          </p>
        </div>
        
        {!hasJoined ? (
          /* Join Form */
          <div className="bg-card/80 backdrop-blur-sm rounded-lg neon-border-cyan p-6">
            <h2 className="text-lg font-semibold text-primary mb-4 terminal-text">
              ENTER DESIGNATION
            </h2>
            
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="bg-input border-border focus:border-primary"
                maxLength={20}
              />
              
              <Button 
                onClick={handleJoin}
                disabled={!name.trim() || isConnecting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isConnecting ? (
                  <>
                    <Wifi className="w-4 h-4 mr-2 animate-pulse" />
                    CONNECTING...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    CONNECT TO SERVER
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4 terminal-text text-center">
              Two players required to start a session
            </p>
          </div>
        ) : (
          /* Waiting Room */
          <div className="space-y-6">
            {/* Role Card */}
            <div className={`bg-card/80 backdrop-blur-sm rounded-lg ${roleBorder} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary terminal-text">
                  YOUR ROLE
                </h2>
                <div className={`flex items-center gap-2 ${roleColor}`}>
                  <RoleIcon className="w-5 h-5" />
                  <span className="font-bold terminal-text">{myRole}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground terminal-text">
                {myRole === 'USER' 
                  ? 'You will send prompts to the AI. Ask questions, give commands, or start conversations.'
                  : 'You will respond as an AI assistant. Be helpful, creative, and maintain the illusion.'
                }
              </p>
            </div>
            
            {/* Players Status */}
            <div className="bg-card/80 backdrop-blur-sm rounded-lg neon-border-cyan p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-primary terminal-text">
                  CONNECTED PLAYERS
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="terminal-text">{players.length}/2</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {players.map((player) => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-md ${
                      player.role === 'USER' ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {player.role === 'USER' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-secondary" />
                      )}
                      <span className="terminal-text">{player.name}</span>
                    </div>
                    <span className={`text-xs terminal-text ${
                      player.role === 'USER' ? 'text-primary' : 'text-secondary'
                    }`}>
                      {player.role}
                    </span>
                  </div>
                ))}
                
                {players.length < 2 && (
                  <div className="flex items-center justify-center p-3 rounded-md bg-muted/50 border border-dashed border-border">
                    <WifiOff className="w-4 h-4 text-muted-foreground mr-2" />
                    <span className="text-muted-foreground terminal-text text-sm">
                      Waiting for opponent...
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Message */}
            {players.length < 2 ? (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground terminal-text">
                  <div className="w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
                  <span>Waiting for another player to join...</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 terminal-text">
                  Share this page with a friend on the same network
                </p>
              </div>
            ) : (
              <div className="text-center animate-glow-pulse">
                <div className="inline-flex items-center gap-2 text-primary terminal-text">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span>Both players connected! Starting session...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
