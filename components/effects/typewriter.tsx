'use client';

import { useEffect, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

export function Typewriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  onComplete, 
  className = '',
  showCursor = true 
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setHasStarted(true);
    }, delay);
    
    return () => clearTimeout(startTimeout);
  }, [delay]);
  
  useEffect(() => {
    if (!hasStarted) return;
    
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [displayedText, text, speed, hasStarted, isComplete, onComplete]);
  
  return (
    <span className={`terminal-text ${className}`}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="animate-typing-cursor text-primary">_</span>
      )}
    </span>
  );
}

interface TypewriterSequenceProps {
  lines: string[];
  lineSpeed?: number;
  lineDelay?: number;
  onComplete?: () => void;
  className?: string;
  lineClassName?: string;
}

export function TypewriterSequence({
  lines,
  lineSpeed = 30,
  lineDelay = 500,
  onComplete,
  className = '',
  lineClassName = '',
}: TypewriterSequenceProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  
  const handleLineComplete = () => {
    setCompletedLines(prev => [...prev, lines[currentLine]]);
    
    if (currentLine < lines.length - 1) {
      setTimeout(() => setCurrentLine(prev => prev + 1), lineDelay);
    } else {
      onComplete?.();
    }
  };
  
  return (
    <div className={`space-y-1 ${className}`}>
      {completedLines.map((line, i) => (
        <div key={i} className={`terminal-text text-muted-foreground ${lineClassName}`}>
          {line}
        </div>
      ))}
      {currentLine < lines.length && (
        <Typewriter
          key={currentLine}
          text={lines[currentLine]}
          speed={lineSpeed}
          onComplete={handleLineComplete}
          className={lineClassName}
        />
      )}
    </div>
  );
}
