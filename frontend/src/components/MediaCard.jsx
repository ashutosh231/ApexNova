import React, { useMemo, useState } from 'react'
import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import { motion, useReducedMotion } from 'framer-motion'

const MotionPaper = motion(Paper)

export default function MediaCard({ title, subtitle, image, chipLabel }) {
  const reduced = useReducedMotion()
  const [ok, setOk] = useState(true)

  const fallback = useMemo(() => {
    const gradients = [
      'radial-gradient(1200px 500px at 20% 0%, rgba(59,130,246,0.35), transparent 55%), radial-gradient(900px 500px at 80% 0%, rgba(139,92,246,0.30), transparent 55%), linear-gradient(180deg, rgba(12,16,30,0.95), rgba(4,6,12,0.92))',
      'radial-gradient(1000px 520px at 30% 20%, rgba(6,182,212,0.32), transparent 55%), radial-gradient(800px 520px at 70% 10%, rgba(52,211,153,0.20), transparent 60%), linear-gradient(180deg, rgba(12,16,30,0.95), rgba(4,6,12,0.92))',
    ]
    return gradients[(title?.length ?? 0) % gradients.length]
  }, [title])

  return (
    <MotionPaper
      elevation={0}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { y: -6 }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        borderColor: 'rgba(255,255,255,0.10)',
        boxShadow: '0 20px 70px rgba(0,0,0,0.45)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: ok
            ? `linear-gradient(180deg, rgba(5,7,17,0.0) 0%, rgba(5,7,17,0.65) 55%, rgba(5,7,17,0.92) 100%), url(${image})`
            : fallback,
          backgroundSize: ok ? 'cover' : 'auto',
          backgroundPosition: 'center',
          filter: 'saturate(1.2) contrast(1.05)',
          transform: 'scale(1.02)',
        }}
      />

      {/* prefetch image; if it fails, switch to gradient */}
      {image ? (
        <img
          src={image}
          alt=""
          style={{ display: 'none' }}
          onError={() => setOk(false)}
        />
      ) : null}

      {/* animated border glow */}
      <Box
        sx={{
          position: 'absolute',
          inset: -1,
          borderRadius: 3,
          background:
            'conic-gradient(from 180deg at 50% 50%, rgba(59,130,246,0.0), rgba(59,130,246,0.35), rgba(139,92,246,0.35), rgba(6,182,212,0.25), rgba(52,211,153,0.15), rgba(59,130,246,0.0))',
          opacity: 0.35,
          filter: 'blur(14px)',
          animation: reduced ? 'none' : 'spinGlow 8s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', p: 2.25, minHeight: 220, display: 'flex' }}>
        <Stack spacing={1} sx={{ mt: 'auto' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {chipLabel ? (
              <Chip
                size="small"
                label={chipLabel}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 700,
                }}
              />
            ) : null}
            <Typography
              variant="overline"
              sx={{
                letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.55)',
                fontWeight: 800,
              }}
            >
              {subtitle}
            </Typography>
          </Stack>
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Space Grotesk","Inter",system-ui',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>
        </Stack>
      </Box>

      <style>{`
        @keyframes spinGlow { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </MotionPaper>
  )
}

