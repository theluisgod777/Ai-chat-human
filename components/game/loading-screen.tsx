'use client';

import { useEffect, useState } from 'react';
import { GlitchText } from '@/components/effects/glitch-text';
import { TypewriterSequence } from '@/components/effects/typewriter';
import { Particles } from '@/components/effects/particles';
import { Scanlines } from '@/components/effects/scanlines';
import { Progress } from '@/components/ui/progress';

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_SEQUENCE = [
  '> Initializing AI Neural Interface v2.4.7...',
  '> Loading cognitive matrix modules...',
  '> Calibrating response algorithms...',
  '> Establishing secure connection...',
  '> Verifying quantum encryption keys...',
  '> Synchronizing with central server...',
  '> Neural link ready.',
  '> System online.',
];

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showSequence, setShowSequence] = useState(false);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  
  useEffect(() => {
    // Small delay before starting
    const startTimer = setTimeout(() => {
      setShowSequence(true);
    }, 500);
    
    return () => clearTimeout(startTimer);
  }, []);
  
  useEffect(() => {
    if (!showSequence) return;
    
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [showSequence]);
  
  useEffect(() => {
    if (sequenceComplete && progress >= 100) {
      const timer = setTimeout(onComplete, 1000);
      return () => clearTimeout(timer);
    }
  }, [sequenceComplete, progress, onComplete]);
  
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Particles count={40} />
      <Scanlines opacity={0.03} />
      
      <div className="relative z-10 w-full max-w-2xl mx-4">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <GlitchText 
            text="AI CHAT SIMULATOR" 
            className="text-4xl md:text-6xl font-bold glow-cyan"
            continuous
          />
          <p className="text-muted-foreground mt-4 terminal-text">
            NEURAL INTERFACE PROTOCOL
          </p>
        </div>
        
        {/* Terminal Window */}
        <div className="bg-card/80 backdrop-blur-sm rounded-lg neon-border-cyan overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div className="w-3 h-3 rounded-full bg-neon-orange" />
            <div className="w-3 h-3 rounded-full bg-neon-green" />
            <span className="ml-4 text-xs text-muted-foreground terminal-text">
              system_boot.exe
            </span>
          </div>
          
          {/* Terminal Content */}
          <div className="p-6 min-h-[300px]">
            {showSequence && (
              <TypewriterSequence
                lines={BOOT_SEQUENCE}
                lineSpeed={25}
                lineDelay={300}
                onComplete={() => setSequenceComplete(true)}
                lineClassName="text-sm md:text-base text-primary"
              />
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="px-6 pb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-2 terminal-text">
              <span>LOADING SYSTEMS</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
        
        {/* Status */}
        {sequenceComplete && progress >= 100 && (
          <div className="text-center mt-8 animate-glow-pulse">
            <span className="text-primary terminal-text text-lg">
              ENTERING SIMULATION...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
