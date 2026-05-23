import React from 'react';

/**
 * Decorative SVG patterns that give each game-specific lobby its own
 * visual identity. All patterns sit behind content as `pointer-events: none`.
 *
 * Props:
 *   pattern  — 'serpentine' | 'grid' | 'cards' | 'numeric' | 'scanlines' | 'checkered'
 *   accent   — primary color (string)
 *   secondary— secondary color (string)
 */
const GamePattern = ({ pattern = 'grid', accent = '#ccff00', secondary = '#10b981' }) => {
  switch (pattern) {
    /* ── Snake: organic flowing curves ── */
    case 'serpentine':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.18,
          }}
        >
          <defs>
            <pattern id="snakeWeave" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0 60 Q 30 0, 60 60 T 120 60"
                stroke={accent} strokeWidth="1.5" fill="none" opacity="0.7"
              />
              <path
                d="M0 100 Q 30 40, 60 100 T 120 100"
                stroke={secondary} strokeWidth="1" fill="none" opacity="0.5"
              />
              <circle cx="20" cy="60" r="2" fill={accent} opacity="0.8" />
              <circle cx="100" cy="100" r="1.5" fill={secondary} opacity="0.7" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#snakeWeave)" />
        </svg>
      );

    /* ── Tic Tac Toe: bold 3x3 lattice ── */
    case 'grid':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.16,
          }}
        >
          <defs>
            <pattern id="ticGrid" width="180" height="180" patternUnits="userSpaceOnUse">
              {/* 3x3 grid */}
              <line x1="60" y1="0" x2="60" y2="180" stroke={accent} strokeWidth="2" opacity="0.5" />
              <line x1="120" y1="0" x2="120" y2="180" stroke={accent} strokeWidth="2" opacity="0.5" />
              <line x1="0" y1="60" x2="180" y2="60" stroke={accent} strokeWidth="2" opacity="0.5" />
              <line x1="0" y1="120" x2="180" y2="120" stroke={accent} strokeWidth="2" opacity="0.5" />
              {/* X marks */}
              <g transform="translate(20, 20)" stroke={secondary} strokeWidth="3" opacity="0.6" strokeLinecap="round">
                <line x1="0" y1="0" x2="20" y2="20" />
                <line x1="20" y1="0" x2="0" y2="20" />
              </g>
              <g transform="translate(140, 140)" stroke={secondary} strokeWidth="3" opacity="0.5" strokeLinecap="round">
                <line x1="0" y1="0" x2="20" y2="20" />
                <line x1="20" y1="0" x2="0" y2="20" />
              </g>
              {/* O marks */}
              <circle cx="90" cy="30" r="11" stroke={accent} strokeWidth="3" fill="none" opacity="0.5" />
              <circle cx="30" cy="90" r="11" stroke={secondary} strokeWidth="3" fill="none" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ticGrid)" />
        </svg>
      );

    /* ── Memory Grand Prix: scattered cards ── */
    case 'cards':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.16,
          }}
        >
          <defs>
            <pattern id="memoCards" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
              <rect x="20" y="20" width="40" height="56" rx="6" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.6" />
              <rect x="100" y="40" width="40" height="56" rx="6" fill={secondary} opacity="0.12" stroke={secondary} strokeWidth="1.5" />
              <rect x="60" y="120" width="40" height="56" rx="6" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5" />
              <rect x="140" y="120" width="40" height="56" rx="6" fill={accent} opacity="0.1" stroke={accent} strokeWidth="1.5" />
              <text x="40" y="55" textAnchor="middle" fill={accent} fontSize="20" fontWeight="800" opacity="0.55">?</text>
              <text x="120" y="75" textAnchor="middle" fill={secondary} fontSize="20" fontWeight="800" opacity="0.7">?</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#memoCards)" />
        </svg>
      );

    /* ── Number guessing: floating digits ── */
    case 'numeric':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.14,
          }}
        >
          <defs>
            <pattern id="numericPat" width="220" height="220" patternUnits="userSpaceOnUse">
              <text x="20" y="50" fill={accent} fontSize="48" fontWeight="900" fontFamily="'JetBrains Mono', monospace" opacity="0.5">42</text>
              <text x="120" y="100" fill={secondary} fontSize="32" fontWeight="800" fontFamily="'JetBrains Mono', monospace" opacity="0.6">?</text>
              <text x="40" y="160" fill={accent} fontSize="28" fontWeight="700" fontFamily="'JetBrains Mono', monospace" opacity="0.5">128</text>
              <text x="150" y="200" fill={secondary} fontSize="40" fontWeight="900" fontFamily="'JetBrains Mono', monospace" opacity="0.55">7</text>
              <text x="170" y="40" fill={accent} fontSize="22" fontWeight="700" fontFamily="'JetBrains Mono', monospace" opacity="0.5">↑</text>
              <text x="80" y="200" fill={secondary} fontSize="22" fontWeight="700" fontFamily="'JetBrains Mono', monospace" opacity="0.5">↓</text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#numericPat)" />
        </svg>
      );

    /* ── Pixel Memory Ultra: CRT scanlines + retro grid ── */
    case 'scanlines':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.22,
          }}
        >
          <defs>
            <pattern id="scanlinesPat" width="100%" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100%" y2="0" stroke={accent} strokeWidth="1" opacity="0.4" />
            </pattern>
            <pattern id="pixelGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="2" height="2" fill={accent} opacity="0.5" />
              <rect x="16" y="16" width="2" height="2" fill={secondary} opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pixelGrid)" />
          <rect width="100%" height="100%" fill="url(#scanlinesPat)" opacity="0.5" />
        </svg>
      );

    /* ── Chess: alternating squares ── */
    case 'checkered':
      return (
        <svg
          aria-hidden
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            pointerEvents: 'none', opacity: 0.14,
          }}
        >
          <defs>
            <pattern id="chessPat" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="40" height="40" fill={accent} opacity="0.6" />
              <rect x="40" y="40" width="40" height="40" fill={accent} opacity="0.6" />
              <rect x="40" y="0" width="40" height="40" fill={secondary} opacity="0.4" />
              <rect x="0" y="40" width="40" height="40" fill={secondary} opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chessPat)" />
        </svg>
      );

    default:
      return null;
  }
};

export default GamePattern;
