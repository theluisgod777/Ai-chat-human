'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatBubble } from '@/components/game/chat-bubble';
import { TypingIndicator } from '@/components/game/typing-indicator';
import { SystemLogs } from '@/components/game/system-logs';
import { StatusPanel } from '@/components/game/status-panel';
import { Scanlines } from '@/components/effects/scanlines';
import { useGameStore, sendMessage, setTyping, pollGameState } from '@/lib/game-store';
import { SYSTEM_LOG_MESSAGES } from '@/lib/game-types';
import { Send } from 'lucide-react';

export function ChatScreen() {
  const [inputValue, setInputValue] = useState('');
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const {
    messages,
    myId,
    myRole,
    isOpponentTyping,
    setMessages,
    addSystemLog,
    addRandomProcessingLogs,
    setOpponentTyping,
    setPlayers,
    lastPollTime,
    setLastPollTime,
  } = useGameStore();
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpponentTyping]);
  
  // Polling for game state
  const poll = useCallback(async () => {
    if (!myId) return;
    
    try {
      const data = await pollGameState(myId, lastPollTime);
      setPlayers(data.players);
      setOpponentTyping(data.isOpponentTyping);
      
      // Handle new messages
      if (data.messages && data.messages.length > 0) {
        for (const message of data.messages) {
          // Add system logs based on message sender
          if (message.sender === 'USER') {
            const randomMsg = SYSTEM_LOG_MESSAGES.USER_PROMPT[
              Math.floor(Math.random() * SYSTEM_LOG_MESSAGES.USER_PROMPT.length)
            ];
            addSystemLog('INFO', randomMsg);
          } else {
            const randomMsg = SYSTEM_LOG_MESSAGES.AI_RESPONSE[
              Math.floor(Math.random() * SYSTEM_LOG_MESSAGES.AI_RESPONSE.length)
            ];
            addSystemLog('SUCC', randomMsg);
          }
        }
        setMessages(data.messages);
      }
      
      // Add processing logs when AI is typing
      if (data.isOpponentTyping && myRole === 'USER' && !isOpponentTyping) {
        addRandomProcessingLogs();
      }
      
      setLastPollTime(data.lastUpdate);
    } catch (error) {
      console.error('Poll error:', error);
    }
  }, [myId, myRole, lastPollTime, isOpponentTyping, setPlayers, setOpponentTyping, setMessages, addSystemLog, addRandomProcessingLogs, setLastPollTime]);
  
  // Start polling
  useEffect(() => {
    if (myId) {
      poll();
      pollIntervalRef.current = setInterval(poll, 500);
      
      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [myId, poll]);
  
  // Handle typing indicator
  const handleTyping = useCallback(async () => {
    if (!myId) return;
    
    if (!isTypingLocal) {
      setIsTypingLocal(true);
      await setTyping(myId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      setIsTypingLocal(false);
      await setTyping(myId, false);
    }, 1000);
  }, [myId, isTypingLocal]);
  
  const handleSend = async () => {
    if (!inputValue.trim() || !myId) return;
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTypingLocal(false);
    await setTyping(myId, false);
    
    // Send message
    await sendMessage(myId, inputValue.trim());
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const opponentRole = myRole === 'USER' ? 'AI' : 'USER';
  
  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <Scanlines opacity={0.02} />
      
      {/* Status Bar */}
      <StatusPanel />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 md:p-6"
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground terminal-text mb-2">
                    Session started. Begin your conversation.
                  </p>
                  <p className="text-xs text-muted-foreground/60 terminal-text">
                    {myRole === 'USER' 
                      ? 'Type a prompt to start chatting with the AI'
                      : 'Wait for the USER to send a prompt, then respond as an AI'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={message.sender === myRole}
                  />
                ))}
                {isOpponentTyping && (
                  <TypingIndicator senderRole={opponentRole} />
                )}
              </>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/50">
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder={myRole === 'USER' ? 'Enter your prompt...' : 'Type your AI response...'}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-input border-border focus:border-primary terminal-text"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`px-6 ${
                  myRole === 'USER' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 terminal-text text-center">
              Press Enter to send
            </p>
          </div>
        </div>
        
        {/* System Logs Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 border-l border-border">
          <SystemLogs />
        </div>
      </div>
    </div>
  );
}
