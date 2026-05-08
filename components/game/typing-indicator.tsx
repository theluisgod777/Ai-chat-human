'use client';

import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  senderRole: 'USER' | 'AI';
}

export function TypingIndicator({ senderRole }: TypingIndicatorProps) {
  const isAI = senderRole === 'AI';
  
  return (
    <div className="flex gap-3 mb-4">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isAI ? 'bg-secondary/20' : 'bg-primary/20'
      }`}>
        <Bot className={`w-4 h-4 ${isAI ? 'text-secondary' : 'text-primary'}`} />
      </div>
      
      {/* Typing Animation */}
      <div className="flex flex-col items-start">
        <span className={`text-xs terminal-text mb-1 ${isAI ? 'text-secondary' : 'text-primary'}`}>
          {senderRole}
        </span>
        <div className={`px-4 py-3 rounded-lg rounded-tl-sm ${
          isAI 
            ? 'bg-secondary/10 border border-secondary/30' 
            : 'bg-primary/10 border border-primary/30'
        }`}>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isAI ? 'bg-secondary' : 'bg-primary'} animate-pulse`}
              style={{ animationDelay: '0ms' }} 
            />
            <div className={`w-2 h-2 rounded-full ${isAI ? 'bg-secondary' : 'bg-primary'} animate-pulse`}
              style={{ animationDelay: '150ms' }} 
            />
            <div className={`w-2 h-2 rounded-full ${isAI ? 'bg-secondary' : 'bg-primary'} animate-pulse`}
              style={{ animationDelay: '300ms' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
