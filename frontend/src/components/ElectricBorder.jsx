import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ElectricBorder = ({
  children,
  color = '#ccff00',
  speed = 1,
  chaos = 0.15,
  borderRadius = 16,
  padding = 2,
  className = ''
}) => {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{
        padding: `${padding}px`,
        borderRadius: `${borderRadius}px`,
        position: 'relative',
        display: 'inline-block'
      }}
    >
      {/* Glow layer */}
      <motion.div
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2 / speed,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${borderRadius}px`,
          background: `linear-gradient(45deg, transparent 40%, ${color} 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
          filter: 'blur(8px)',
          zIndex: 0,
        }}
      />
      
      {/* Animated border line */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '200% 200%']
        }}
        transition={{
          duration: 4 / speed,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${borderRadius}px`,
          background: `linear-gradient(115deg, transparent 20%, ${color} 40%, ${color} 60%, transparent 80%)`,
          backgroundSize: '200% 200%',
          opacity: 0.8 + chaos,
          zIndex: 0,
        }}
      />

      {/* Inner Mask (to hollow out the border) */}
      <div
        style={{
          position: 'absolute',
          inset: `${padding}px`,
          borderRadius: `${borderRadius - padding}px`,
          background: '#060608', // Match background color to conceal the center
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, borderRadius: `${borderRadius - padding}px`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

export default ElectricBorder;
