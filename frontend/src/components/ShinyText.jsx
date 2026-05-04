import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useMotionValue, useAnimationFrame, useTransform } from 'framer-motion';

const ShinyText = ({
  text, disabled = false, speed = 2, className = '', color = '#b5b5b5',
  shineColor = '#ffffff', spread = 120, yoyo = false, pauseOnHover = false,
  direction = 'left', delay = 0,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef(null);
  const directionRef = useRef(direction === 'left' ? 1 : -1);
  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  useAnimationFrame(time => {
    if (disabled || isPaused) { lastTimeRef.current = null; return; }
    if (lastTimeRef.current === null) { lastTimeRef.current = time; return; }
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    elapsedRef.current += dt;
    if (yoyo) {
      const cd = animationDuration + delayDuration;
      const fc = cd * 2;
      const ct = elapsedRef.current % fc;
      if (ct < animationDuration) { const p = (ct / animationDuration) * 100; progress.set(directionRef.current === 1 ? p : 100 - p); }
      else if (ct < cd) { progress.set(directionRef.current === 1 ? 100 : 0); }
      else if (ct < cd + animationDuration) { const rt = ct - cd; const p = 100 - (rt / animationDuration) * 100; progress.set(directionRef.current === 1 ? p : 100 - p); }
      else { progress.set(directionRef.current === 1 ? 0 : 100); }
    } else {
      const cd = animationDuration + delayDuration;
      const ct = elapsedRef.current % cd;
      if (ct < animationDuration) { const p = (ct / animationDuration) * 100; progress.set(directionRef.current === 1 ? p : 100 - p); }
      else { progress.set(directionRef.current === 1 ? 100 : 0); }
    }
  });

  useEffect(() => { directionRef.current = direction === 'left' ? 1 : -1; elapsedRef.current = 0; progress.set(0); }, [direction]);

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);
  const handleMouseEnter = useCallback(() => { if (pauseOnHover) setIsPaused(true); }, [pauseOnHover]);
  const handleMouseLeave = useCallback(() => { if (pauseOnHover) setIsPaused(false); }, [pauseOnHover]);

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
  };

  return (
    <motion.span className={className} style={{ display: 'inline-block', ...gradientStyle, backgroundPosition }}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {text}
    </motion.span>
  );
};

export default ShinyText;
