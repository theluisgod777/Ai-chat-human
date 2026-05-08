'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import { formatTimestamp } from '@/lib/game-types';
import { cn } from '@/lib/utils';
import { Terminal } from 'lucide-react';

export function SystemLogs() {
  const { systemLogs } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [systemLogs]);
  
  const getLogColor = (type: string) => {
    switch (type) {
      case 'INFO': return 'text-primary';
      case 'PROC': return 'text-neon-orange';
      case 'SUCC': return 'text-neon-green';
      case 'WARN': return 'text-neon-orange';
      case 'ERR': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-card/50 rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
        <Terminal className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground terminal-text uppercase">
          System Logs
        </span>
      </div>
      
      {/* Logs */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {systemLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground terminal-text">
            Awaiting system events...
          </p>
        ) : (
          systemLogs.map((log) => (
            <div key={log.id} className="text-xs terminal-text flex gap-2">
              <span className="text-muted-foreground shrink-0">
                [{formatTimestamp(log.timestamp)}]
              </span>
              <span className={cn('shrink-0', getLogColor(log.type))}>
                [{log.type}]
              </span>
              <span className="text-foreground/80">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
