import React from 'react';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// 1. Custom Medal of Valor Icon (Matching user uploaded sketch)
export function MedalOfValorIcon({ className = "w-8 h-8", color = "currentColor", size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Ribbon with Vertical Stripes */}
      <path 
        d="M6 3H26V15L16 21L6 15V3Z" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <line x1="11" y1="3" x2="11" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="21" y1="3" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Circular Medal Medallion */}
      <circle 
        cx="16" 
        cy="22" 
        r="8" 
        fill="#00081e" 
        stroke={color} 
        strokeWidth="2" 
      />

      {/* 5-Pointed Star in Medal */}
      <path 
        d="M16 16.5L17.8 20.2L21.9 20.8L18.9 23.7L19.6 27.8L16 25.9L12.4 27.8L13.1 23.7L10.1 20.8L14.2 20.2L16 16.5Z" 
        fill={color} 
      />
    </svg>
  );
}

// 2. Custom Top Detective / Special Investigations Icon (Matching user sketch)
export function DetectiveIcon({ className = "w-8 h-8", color = "currentColor", size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fedora Hat Crown */}
      <path 
        d="M11 11.5C11 8.5 13 6 16 6C19 6 21 8.5 21 11.5H11Z" 
        fill={color} 
      />
      {/* Hat Crown Crease & Band */}
      <path 
        d="M13 7.5C14.5 8.5 17.5 8.5 19 7.5" 
        stroke="#00081e" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <rect x="11" y="10.5" width="10" height="1.5" fill="#00081e" />

      {/* Wide Fedora Brim */}
      <path 
        d="M6 13C10 11.5 22 11.5 26 13C27 13.4 26 14.5 24 14.5C18 14.5 14 14.5 8 14.5C6 14.5 5 13.4 6 13Z" 
        fill={color} 
      />

      {/* Dark Glasses / Shades */}
      <path 
        d="M10 17C10 16 12 15.5 14.5 15.5C15.2 15.5 15.6 15.8 16 16.2C16.4 15.8 16.8 15.5 17.5 15.5C20 15.5 22 16 22 17C22 18.5 20.5 19.5 18 19.5C16.5 19.5 15.8 18.8 16 18C16.2 18.8 15.5 19.5 14 19.5C11.5 19.5 10 18.5 10 17Z" 
        fill="#00081e" 
        stroke={color} 
        strokeWidth="1.5" 
      />

      {/* High-Collar Trench Coat Lapels */}
      <path 
        d="M8 20L13 27L16 21L19 27L24 20L27 24L24 30H8L5 24L8 20Z" 
        fill={color} 
        opacity="0.9" 
      />
      <path 
        d="M13 27L16 22L19 27" 
        stroke="#00081e" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

// 3. Custom Leadership & Public Service Icon (Matching user sketch)
export function LeadershipIcon({ className = "w-8 h-8", color = "currentColor", size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Team Member (Background) */}
      <circle cx="8.5" cy="11.5" r="3.5" fill={color} opacity="0.65" />
      <path 
        d="M3 21C3 18 5.5 16 8.5 16C10.5 16 12.3 17 13.2 18.5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.65" 
      />

      {/* Right Team Member (Background) */}
      <circle cx="23.5" cy="11.5" r="3.5" fill={color} opacity="0.65" />
      <path 
        d="M18.8 18.5C19.7 17 21.5 16 23.5 16C26.5 16 29 18 29 21" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.65" 
      />

      {/* Center Leader (Foreground) */}
      <circle cx="16" cy="9.5" r="4.5" fill={color} />
      <path 
        d="M9 22C9 18 12.1 15 16 15C19.9 15 23 18 23 22" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />

      {/* Leadership Star Badge (Bottom Center) */}
      <path 
        d="M16 20L17.5 23.2L21 23.7L18.5 26.1L19.1 29.5L16 27.9L12.9 29.5L13.5 26.1L11 23.7L14.5 23.2L16 20Z" 
        fill={color} 
        stroke="#00081e" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
