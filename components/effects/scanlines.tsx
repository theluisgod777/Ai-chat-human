'use client';

interface ScanlinesProps {
  opacity?: number;
  className?: string;
}

export function Scanlines({ opacity = 0.05, className = '' }: ScanlinesProps) {
  return (
    <div 
      className={`absolute inset-0 pointer-events-none z-50 ${className}`}
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, ${opacity}) 2px,
          rgba(0, 0, 0, ${opacity}) 4px
        )`,
      }}
    />
  );
}
