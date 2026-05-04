import React, { useCallback, useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

export default function VideoBackground({ src = '/gaming-bg.mp4' }) {
  const reduced = useReducedMotion()
  const ref = useRef(null)

  const tryPlay = useCallback(() => {
    const el = ref.current
    if (!el || reduced) return
    const p = el.play?.()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  }, [reduced])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.pause?.()
      return
    }

    // Autoplay can be blocked in some browsers; muted+playsInline generally works.
    tryPlay()
  }, [reduced, tryPlay])

  return (
    <div className="video-bg-wrap" aria-hidden="true">
      <video
        ref={ref}
        className="video-bg"
        autoPlay={!reduced}
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={tryPlay}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="video-bg-overlay" />
    </div>
  )
}

