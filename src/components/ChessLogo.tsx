import React from "react";

export default function ChessLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
    >
      <defs>
        {/* Navy to Burgundy subtle gradient for Knight */}
        <linearGradient id="knightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7D1B34" />
          <stop offset="50%" stopColor="#4A1120" />
          <stop offset="100%" stopColor="#1B2A4A" />
        </linearGradient>
        {/* Gold premium metallic gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7A5C00" />
          <stop offset="50%" stopColor="#A67C00" />
          <stop offset="100%" stopColor="#E5C158" />
        </linearGradient>
        {/* Navy to slate for graph bars */}
        <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2E4473" />
          <stop offset="100%" stopColor="#1B2A4A" />
        </linearGradient>
      </defs>

      {/* Background Glow */}
      <circle cx="256" cy="256" r="240" fill="#1B2A4A" fillOpacity="0.03" />

      {/* Decorative Outer Ring */}
      <circle cx="256" cy="256" r="230" stroke="#A67C00" strokeWidth="2" strokeDasharray="6,6" strokeOpacity="0.5" />

      {/* Rising Bar Graph Background Layer */}
      <rect x="360" y="180" width="35" height="200" rx="6" fill="url(#navyGrad)" />
      <rect x="310" y="230" width="35" height="150" rx="6" fill="url(#goldGrad)" />
      <rect x="260" y="280" width="35" height="100" rx="6" fill="#7D1B34" />

      {/* Arrow pointing up and right */}
      <path
        d="M230 330 L395 165 M395 165 L340 165 M395 165 L395 220"
        stroke="url(#goldGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tech/Circuitry Chess Knight */}
      {/* Base */}
      <path
        d="M120 380 L240 380 C240 380 250 380 250 365 C250 350 240 350 240 350 L120 350 C120 350 110 350 110 365 C110 380 120 380 120 380 Z"
        fill="url(#knightGrad)"
        stroke="#A67C00"
        strokeWidth="2"
      />
      
      {/* Middle Base Ring */}
      <path
        d="M130 350 C130 350 140 335 180 335 C220 335 230 350 230 350 Z"
        fill="#7D1B34"
        stroke="#A67C00"
        strokeWidth="1.5"
      />

      {/* Knight Body */}
      <path
        d="M140 335 
           C140 335 120 280 125 250 
           C130 220 110 180 125 150
           C135 130 155 125 165 135
           C170 120 185 110 195 115
           C210 120 215 135 210 150
           C225 155 245 180 240 210
           C235 240 210 270 215 310
           C215 320 225 330 225 335 Z"
        fill="url(#knightGrad)"
        stroke="#A67C00"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Golden Mane / Accent circuit line */}
      <path
        d="M150 330 C150 280 140 250 145 220 C150 190 145 160 160 145"
        stroke="url(#goldGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eye of Knight */}
      <circle cx="185" cy="165" r="5" fill="#E5C158" />
      <circle cx="185" cy="165" r="2" fill="#FFFFFF" />

      {/* Circuit board dots inside Knight */}
      <circle cx="170" cy="250" r="4" fill="#A67C00" />
      <line x1="170" y1="250" x2="190" y2="250" stroke="#A67C00" strokeWidth="2" />
      <circle cx="190" cy="250" r="4" fill="#A67C00" />
      
      <circle cx="180" cy="290" r="4" fill="#A67C00" />
      <line x1="180" y1="290" x2="165" y2="310" stroke="#A67C00" strokeWidth="2" />
      <circle cx="165" cy="310" r="4" fill="#A67C00" />

      {/* Interlocking Gearwheels */}
      {/* Center Gold Gear */}
      <g transform="translate(260, 240) scale(0.7)">
        <circle cx="0" cy="0" r="30" fill="url(#goldGrad)" stroke="#1B2A4A" strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="#FFFFFF" />
        {/* Teeth */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <rect
            key={angle}
            x="-8"
            y="-38"
            width="16"
            height="15"
            rx="3"
            transform={`rotate(${angle})`}
            fill="url(#goldGrad)"
            stroke="#1B2A4A"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* Top Blue/Grey Gear */}
      <g transform="translate(230, 160) scale(0.55)">
        <circle cx="0" cy="0" r="30" fill="url(#navyGrad)" stroke="#A67C00" strokeWidth="2" />
        <circle cx="0" cy="0" r="12" fill="#FFFFFF" />
        {/* Teeth */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
          <rect
            key={angle}
            x="-8"
            y="-38"
            width="16"
            height="15"
            rx="3"
            transform={`rotate(${angle})`}
            fill="url(#navyGrad)"
            stroke="#A67C00"
            strokeWidth="1.5"
          />
        ))}
      </g>

    </svg>
  );
}
