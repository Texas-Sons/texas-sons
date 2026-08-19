import React, { useState } from 'react';

export default function TexasSonsLogo({ className = "w-10 h-10" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img 
        src="/logo.png" 
        alt="Texas Sons Logo" 
        className={`object-contain ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg viewBox="0 14 100 66" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g strokeLinecap="square" strokeLinejoin="miter">
        {/* HORN - UPPER (ORANGE) */}
        {/* Left */}
        <path d="M 38 34 C 20 34 10 26 5 18" stroke="#c2410c" strokeWidth="4" fill="none" />
        {/* Right */}
        <path d="M 62 34 C 80 34 90 26 95 18" stroke="#c2410c" strokeWidth="4" fill="none" />
        
        {/* HORN - LOWER (GRAY) */}
        {/* Left */}
        <path d="M 35 38 C 18 38 8 30 5 18" stroke="#64748b" strokeWidth="3" fill="none" />
        {/* Right */}
        <path d="M 65 38 C 82 38 92 30 95 18" stroke="#64748b" strokeWidth="3" fill="none" />

        {/* CROWN (ORANGE) */}
        <path d="M 40 30 L 46 26 L 54 26 L 60 30" stroke="#c2410c" strokeWidth="4" fill="none" />

        {/* OUTER SKULL (ORANGE) */}
        {/* Left side */}
        <path d="M 40 30 L 32 44 L 38 56 L 44 56 L 46 76 L 54 76 L 56 56 L 62 56 L 68 44 L 60 30" stroke="#c2410c" strokeWidth="4" fill="none" />

        {/* INNER BONES (GRAY) */}
        {/* Left inner */}
        <path d="M 40 30 L 42 44 L 46 56 L 46 76" stroke="#64748b" strokeWidth="3" fill="none" />
        {/* Right inner */}
        <path d="M 60 30 L 58 44 L 54 56 L 54 76" stroke="#64748b" strokeWidth="3" fill="none" />

        {/* CENTER NOSE PILLAR (ORANGE) */}
        <path d="M 50 56 L 50 76" stroke="#c2410c" strokeWidth="4" fill="none" />

        {/* FOREHEAD STAR (GRAY) */}
        <polygon 
          points="50,33 51.5,37.5 56,37.5 52.5,40.5 54,45 50,42 46,45 47.5,40.5 44,37.5 48.5,37.5" 
          fill="#64748b" 
        />

        {/* CHEEK ACCENTS (GRAY) */}
        <path d="M 32 44 L 42 44 L 38 56" stroke="#64748b" strokeWidth="3" fill="none" />
        <path d="M 68 44 L 58 44 L 62 56" stroke="#64748b" strokeWidth="3" fill="none" />
      </g>
    </svg>
  );
}
