'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: 'cyan' | 'magenta' | 'blue';
}

interface ParticlesProps {
  count?: number;
  className?: string;
}

export function Particles({ count = 30, className = '' }: ParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    const colors: Particle['color'][] = ['cyan', 'magenta', 'blue'];
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setParticles(newParticles);
  }, [count]);
  
  const getColor = (color: Particle['color']) => {
    switch (color) {
      case 'cyan': return 'bg-primary';
      case 'magenta': return 'bg-secondary';
      case 'blue': return 'bg-accent';
    }
  };
  
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full ${getColor(particle.color)} opacity-60`}
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `particle-float ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
