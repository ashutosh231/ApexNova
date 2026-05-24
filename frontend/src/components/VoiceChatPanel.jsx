import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceChat } from '../hooks/useVoiceChat';

const MONO = "'JetBrains Mono', monospace";

/**
 * Voice-chat strip for the match lobby.
 * - "Enable Voice" button requests mic + builds peer connections
 * - Mic toggle:    mute outgoing voice
 * - Speaker toggle: mute incoming voice (deafen)
 * - Roster pills with per-player speaking indicators
 * - Local user gets a live VU bar
 */
const VoiceChatPanel = ({ roomCode, userId, players, token, accent = '#ccff00', secondary = '#10b981' }) => {
  const [enabled, setEnabled] = useState(false);

  const {
    localMuted,
    toggleMute,
    deafened,
    toggleDeafen,
    error,
    micState,
    speakingPeers,
    connectedPeers,
    localSpeaking,
    localLevel,
  } = useVoiceChat({ roomCode, userId, players, token, enabled });

  const otherPlayers = (players || []).filter((p) => p.id !== userId);
  const isLive = micState === 'live';
  const isRequesting = micState === 'requesting';
  const isDenied = micState === 'denied' || micState === 'error';

  const handleToggle = () => setEnabled((v) => !v);

  const connectedCount = Object.values(connectedPeers).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="arena-card"
      style={{
        padding: '12px 16px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        borderColor: isLive ? `${accent}45` : 'rgba(255,255,255,0.08)',
        boxShadow: isLive ? `0 0 22px -8px ${accent}` : 'none',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* ── Enable Voice toggle button ── */}
      <button
        onClick={handleToggle}
        disabled={isRequesting}
        style={{
          position: 'relative',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          borderRadius: 12,
          border: 'none',
          cursor: isRequesting ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.04em',
          color: isLive ? '#0a0a0c' : '#fff',
          background: isLive
            ? `linear-gradient(135deg, ${accent}, ${secondary})`
            : 'rgba(255,255,255,0.06)',
          boxShadow: isLive ? `0 6px 20px -6px ${accent}` : 'none',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => {
          if (!isLive && !isRequesting) e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
        }}
        onMouseLeave={(e) => {
          if (!isLive && !isRequesting) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        }}
      >
        {isRequesting ? (
          <>
            <iconify-icon icon="tabler:loader-2" width="16" style={{ animation: 'voiceSpin 0.8s linear infinite' }} />
            Requesting…
          </>
        ) : isLive ? (
          <>
            <iconify-icon icon="tabler:microphone" width="16" />
            Voice Live
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 10, height: 10, borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 10px #10b981',
              border: '2px solid #060608',
              animation: 'voicePulse 1.5s ease-in-out infinite',
            }} />
          </>
        ) : (
          <>
            <iconify-icon icon="tabler:microphone-off" width="16" />
            Enable Voice
          </>
        )}
      </button>

      {/* ── Mic + Speaker controls (only when live) ── */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ display: 'inline-flex', gap: 8 }}
          >
            {/* Mic mute (outgoing) */}
            <button
              onClick={toggleMute}
              title={localMuted ? 'Unmute microphone' : 'Mute microphone'}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: localMuted ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${localMuted ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.10)'}`,
                color: localMuted ? '#fb7185' : '#fff',
                cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <iconify-icon icon={localMuted ? 'tabler:microphone-off' : 'tabler:microphone'} width="18" />
            </button>

            {/* Speaker / deafen (incoming) */}
            <button
              onClick={toggleDeafen}
              title={deafened ? 'Unmute speakers' : 'Mute speakers'}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: deafened ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${deafened ? 'rgba(248,113,113,0.45)' : 'rgba(255,255,255,0.10)'}`,
                color: deafened ? '#fb7185' : '#fff',
                cursor: 'pointer',
                display: 'grid', placeItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <iconify-icon icon={deafened ? 'tabler:volume-3' : 'tabler:volume'} width="18" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status + roster ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200, flexWrap: 'wrap' }}>
        {!enabled && !isDenied && (
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.50)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <iconify-icon icon="tabler:headphones" width="12" />
            Voice chat off · click to talk live
          </span>
        )}

        {isDenied && (
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fb7185', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <iconify-icon icon="tabler:alert-circle" width="12" />
            {error || 'Mic blocked — check browser permissions'}
          </span>
        )}

        {isLive && (
          <>
            {/* Local row with VU meter */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 12px', borderRadius: 999,
              background: localSpeaking ? `${accent}1f` : 'rgba(255,255,255,0.05)',
              border: `1px solid ${localSpeaking ? `${accent}55` : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: localMuted ? '#fb7185' : (localSpeaking ? accent : 'rgba(235,235,235,0.4)'),
                boxShadow: !localMuted && localSpeaking ? `0 0 8px ${accent}` : 'none',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: MONO, letterSpacing: '0.06em' }}>
                You
              </span>
              {!localMuted && (
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                  {[0.15, 0.3, 0.5, 0.75].map((threshold, i) => (
                    <span
                      key={i}
                      style={{
                        width: 3,
                        height: 4 + i * 2,
                        borderRadius: 1,
                        background: localLevel > threshold ? accent : 'rgba(255,255,255,0.18)',
                        boxShadow: localLevel > threshold ? `0 0 4px ${accent}` : 'none',
                        transition: 'background 80ms linear',
                      }}
                    />
                  ))}
                </div>
              )}
              {localMuted && (
                <iconify-icon icon="tabler:microphone-off" width="11" style={{ color: '#fb7185' }} />
              )}
            </div>

            {/* Other players */}
            {otherPlayers.map((p) => {
              const speaking = !!speakingPeers[p.id];
              const connected = !!connectedPeers[p.id];
              return (
                <motion.div
                  key={p.id}
                  animate={speaking ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5, repeat: speaking ? Infinity : 0 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '5px 12px', borderRadius: 999,
                    background: speaking ? `${secondary}1f` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${speaking ? `${secondary}55` : 'rgba(255,255,255,0.08)'}`,
                    transition: 'background 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: !connected ? 'rgba(235,235,235,0.30)' : (speaking ? secondary : 'rgba(235,235,235,0.50)'),
                    boxShadow: speaking ? `0 0 8px ${secondary}` : 'none',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: MONO, letterSpacing: '0.06em' }}>
                    {p.name?.split(' ')[0] || 'Player'}
                  </span>
                  {speaking && (
                    <iconify-icon icon="tabler:wave-sine" width="12" style={{ color: secondary }} />
                  )}
                  {!connected && (
                    <iconify-icon icon="tabler:loader-2" width="11" style={{ color: 'rgba(235,235,235,0.45)', animation: 'voiceSpin 0.8s linear infinite' }} />
                  )}
                </motion.div>
              );
            })}

            {otherPlayers.length === 0 && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(235,235,235,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Waiting for others to join
              </span>
            )}

            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: 'rgba(235,235,235,0.50)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {connectedCount}/{otherPlayers.length} connected
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes voiceSpin { to { transform: rotate(360deg); } }
        @keyframes voicePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
      `}</style>
    </motion.div>
  );
};

export default VoiceChatPanel;
