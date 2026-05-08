'use client';

import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchOnHover?: boolean;
  continuous?: boolean;
}

export function GlitchText({ text, className = '', glitchOnHover = false, continuous = false }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(continuous);
  
  useEffect(() => {
    if (continuous) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [continuous]);
  
  return (
    <span 
      className={`relative inline-block ${className} ${isGlitching ? 'animate-glitch' : ''}`}
      onMouseEnter={() => glitchOnHover && setIsGlitching(true)}
      onMouseLeave={() => glitchOnHover && setIsGlitching(false)}
    >
      {text}
      {isGlitching && (
        <>
          <span 
            className="absolute inset-0 text-primary opacity-70"
            style={{ clipPath: 'inset(20% 0 40% 0)', transform: 'translate(-2px, 0)' }}
          >
            {text}
          </span>
          <span 
            className="absolute inset-0 text-secondary opacity-70"
            style={{ clipPath: 'inset(60% 0 10% 0)', transform: 'translate(2px, 0)' }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
