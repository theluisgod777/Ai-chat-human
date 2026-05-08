'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/lib/game-types';
import { formatTimestamp } from '@/lib/game-types';
import { User, Bot } from 'lucide-react';

interface ChatBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function ChatBubble({ message, isOwnMessage }: ChatBubbleProps) {
  const isUser = message.sender === 'USER';
  
  return (
    <div className={cn(
      'flex gap-3 mb-4',
      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary/20' : 'bg-secondary/20'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-secondary" />
        )}
      </div>
      
      {/* Message Content */}
      <div className={cn(
        'max-w-[70%] flex flex-col',
        isOwnMessage ? 'items-end' : 'items-start'
      )}>
        {/* Sender Label */}
        <span className={cn(
          'text-xs terminal-text mb-1',
          isUser ? 'text-primary' : 'text-secondary'
        )}>
          {message.sender}
        </span>
        
        {/* Bubble */}
        <div className={cn(
          'px-4 py-3 rounded-lg terminal-text',
          isUser 
            ? 'bg-primary/10 border border-primary/30' 
            : 'bg-secondary/10 border border-secondary/30',
          isOwnMessage ? 'rounded-tr-sm' : 'rounded-tl-sm'
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>
        
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground terminal-text mt-1">
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
