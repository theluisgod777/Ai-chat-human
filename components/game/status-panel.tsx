'use client';

import { useGameStore } from '@/lib/game-store';
import { User, Bot, Wifi, MessageSquare } from 'lucide-react';

export function StatusPanel() {
  const { players, myRole, messages } = useGameStore();
  
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card/80 border-b border-border">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-xs text-muted-foreground terminal-text">
            CONNECTED
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wifi className="w-3 h-3" />
          <span className="text-xs terminal-text">{players.length} ONLINE</span>
        </div>
      </div>
      
      {/* Center: Players */}
      <div className="hidden md:flex items-center gap-6">
        {players.map((player) => (
          <div key={player.id} className="flex items-center gap-2">
            {player.role === 'USER' ? (
              <User className="w-4 h-4 text-primary" />
            ) : (
              <Bot className="w-4 h-4 text-secondary" />
            )}
            <span className={`text-xs terminal-text ${
              player.role === 'USER' ? 'text-primary' : 'text-secondary'
            }`}>
              {player.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Right: My Role & Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          <span className="text-xs terminal-text">{messages.length} MSG</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          myRole === 'USER' ? 'bg-primary/20' : 'bg-secondary/20'
        }`}>
          {myRole === 'USER' ? (
            <User className="w-3 h-3 text-primary" />
          ) : (
            <Bot className="w-3 h-3 text-secondary" />
          )}
          <span className={`text-xs font-medium terminal-text ${
            myRole === 'USER' ? 'text-primary' : 'text-secondary'
          }`}>
            {myRole}
          </span>
        </div>
      </div>
    </div>
  );
}
