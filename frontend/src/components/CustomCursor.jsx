import { useEffect, useRef } from 'react';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const spotlight = spotlightRef.current;

    let fx = 0, fy = 0, cx = 0, cy = 0;
    let rafId;

    const onMove = e => {
      cx = e.clientX;
      cy = e.clientY;
      if (cursor) {
        cursor.style.left = cx + 'px';
        cursor.style.top  = cy + 'px';
      }
      if (spotlight) {
        spotlight.style.background =
          `radial-gradient(400px circle at ${cx}px ${cy}px, rgba(204,255,0,0.06), transparent 70%)`;
      }
    };

    const animate = () => {
      fx += (cx - fx) * 0.12;
      fy += (cy - fy) * 0.12;
      if (follower) {
        follower.style.left = fx + 'px';
        follower.style.top  = fy + 'px';
      }
      rafId = requestAnimationFrame(animate);
    };

    const grow   = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(2)'; };
    const shrink = () => { if (cursor) cursor.style.transform = 'translate(-50%,-50%) scale(1)'; };

    const attachHover = () => {
      document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(el => {
        el.addEventListener('mouseenter', grow);
        el.addEventListener('mouseleave', shrink);
      });
    };

    window.addEventListener('mousemove', onMove);
    rafId = requestAnimationFrame(animate);
    attachHover();

    // Re-attach whenever the DOM changes (route changes render new buttons)
    const observer = new MutationObserver(attachHover);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Spotlight overlay — fixed, below cursor */}
      <div
        ref={spotlightRef}
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          zIndex: 9997, transition: 'background 0.1s ease',
        }}
      />
      {/* Dot */}
      <div ref={cursorRef} className="cursor" />
      {/* Ring follower */}
      <div ref={followerRef} className="cursor-follower" />
    </>
  );
};

export default CustomCursor;
