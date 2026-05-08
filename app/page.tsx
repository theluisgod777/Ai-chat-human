'use client';

import { useEffect } from 'react';
import { LoadingScreen } from '@/components/game/loading-screen';
import { LobbyScreen } from '@/components/game/lobby-screen';
import { ChatScreen } from '@/components/game/chat-screen';
import { useGameStore } from '@/lib/game-store';

export default function GamePage() {
  const { currentScreen, setScreen, reset, leaveRoom } = useGameStore();
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
      reset();
    };
  }, [leaveRoom, reset]);
  
  const handleLoadingComplete = () => {
    setScreen('lobby');
  };
  
  return (
    <main className="min-h-screen bg-background">
      {currentScreen === 'loading' && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}
      {currentScreen === 'lobby' && <LobbyScreen />}
      {currentScreen === 'chat' && <ChatScreen />}
    </main>
  );
}
