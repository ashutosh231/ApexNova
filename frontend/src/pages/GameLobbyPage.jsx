import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';
import {
  getTournamentBySlug,
  syncSessionFromTournament,
  ALL_TOURNAMENT_CONFIGS,
} from '../data/tournamentConfig.js';
import GamePattern from '../components/GamePattern.jsx';

const MONO = "'JetBrains Mono', monospace";
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

/* ── Avatar ─────────────────────────────────────── */
const Avatar = ({ url, name, size = 38, accent = '#ccff00', glow = false }) => (
  <div className={glow ? 'avatar-glow' : ''} style={{ '--av-color': accent, position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: `${accent}14`,
      border: `1.5px solid ${accent}55`,
      display: 'grid', placeItems: 'center',
      fontSize: size * 0.4, fontWeight: 800, color: accent,
    }}>
      {url
        ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.charAt(0) || '?').toUpperCase()
      }
    </div>
  </div>
);

/* ── Stat pill ─────────────────────────────────── */
const StatPill = ({ label, value, accent = '#fff' }) => (
  <div style={{
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  }}>
    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.40)', marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontWeight: 800, fontSize: 14, color: accent }}>{value}</div>
  </div>
);

/* ── Game switcher chip ─────────────────────────── */
const GameSwitchChip = ({ tournament, isActive, navigate, accent: currentAccent }) => (
  <button
    onClick={() => {
      syncSessionFromTournament(tournament.id);
      navigate(`/lobby/${tournament.slug}`);
    }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 999,
      background: isActive ? `${tournament.accent}20` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isActive ? `${tournament.accent}66` : 'rgba(255,255,255,0.10)'}`,
      cursor: isActive ? 'default' : 'pointer',
      fontFamily: MONO, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color: isActive ? tournament.accent : 'rgba(235,235,235,0.65)',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = `${tournament.accent}10`; e.currentTarget.style.borderColor = `${tournament.accent}40`; e.currentTarget.style.color = tournament.accent; } }}
    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(235,235,235,0.65)'; } }}
  >
    <iconify-icon icon={tournament.icon} width="14" />
    {tournament.label.split(' ')[0]}
  </button>
);

/* ════════════════════════════════════════════════ */
const GameLobbyPage = () => {
  const { slug } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const tournament = useMemo(() => getTournamentBySlug(slug), [slug]);
  const accent = tournament.accent;
  const sec = tournament.secondary;

  // Sync session whenever tournament changes
  useEffect(() => {
    syncSessionFromTournament(tournament.id);
  }, [tournament.id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({ user: null, leaderboard: [], friends: [], game: null });
  const [inviteSent, setInviteSent] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [addTag, setAddTag] = useState('');
  const [addResults, setAddResults] = useState([]);
  const [addSearching, setAddSearching] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErr, setAddErr] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/overview`, { headers: authHeaders(token) });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load lobby data');
      setOverview(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token, logout]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    if (!token) return undefined;
    const q = addTag.trim();
    if (q.length < 2) {
      setAddResults([]);
      return undefined;
    }
    const delay = setTimeout(async () => {
      setAddSearching(true);
      setAddErr('');
      try {
        const res = await fetch(`${API_BASE_URL}/lobby/friends/search?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
        if (res.ok) setAddResults(await res.json());
        else setAddResults([]);
      } catch {
        setAddResults([]);
      } finally {
        setAddSearching(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [addTag, token]);

  const handlePlayNow = () => {
    const route = tournament.usesMemoryShell
      ? `/memory-match-room?mode=solo&tournament=${tournament.id}`
      : `/match-room?mode=solo&tournament=${tournament.id}`;
    navigate(route);
  };

  const handlePlayFriend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ game: tournament.backendGame })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const route = tournament.usesMemoryShell
        ? `/memory-match-room?mode=friend&tournament=${tournament.id}&room=${data.room.code}`
        : `/match-room?mode=friend&tournament=${tournament.id}&room=${data.room.code}`;
      navigate(route);
    } catch (e) { console.error('Failed to create match:', e); }
  };

  const submitAddFriend = async (gamerTag) => {
    const t = (gamerTag || addTag).trim().replace(/^@/, '');
    if (!t || addSubmitting) return;
    setAddSubmitting(true);
    setAddErr('');
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/friends`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ gamer_tag: t }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send request');
      setAddTag('');
      setAddResults([]);
      fetchOverview();
    } catch (e) {
      setAddErr(e.message);
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleInvite = async (friend) => {
    if (inviteSent === friend.id) return;
    setInviteSent(friend.id);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/invite`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ friend_id: friend.id, game: tournament.backendGame }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send invite');
      setTimeout(() => {
        const route = tournament.usesMemoryShell
          ? `/memory-match-room?mode=friend&tournament=${tournament.id}&room=${data.room.code}`
          : `/match-room?mode=friend&tournament=${tournament.id}&room=${data.room.code}`;
        navigate(route);
      }, 800);
    } catch (err) {
      console.error(err);
      setInviteSent(null);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    setRemovingId(friendId);
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/friends/${friendId}`, {
        method: 'DELETE', headers: authHeaders(token),
      });
      if (!res.ok) throw new Error('Failed to remove');
      fetchOverview();
    } catch { /* silent */ }
    finally { setRemovingId(null); }
  };

  const onlineCount = useMemo(() => overview.friends.filter((f) => f.status === 'online').length, [overview.friends]);
  const { user, leaderboard, friends } = overview;

  return (
    <div
      className="arena-shell"
      style={{
        '--arena-bloom-1': `${accent}1f`,
        '--arena-bloom-2': `${sec}18`,
        '--arena-bloom-3': 'rgba(56,189,248,0.10)',
        '--arena-bloom-4': 'rgba(189,0,255,0.10)',
        '--arena-orb-1': `${accent}26`,
        '--arena-orb-2': `${sec}1c`,
        '--arena-orb-3': 'rgba(168,85,247,0.18)',
      }}
    >
      <div className="arena-bg-layer">
        <div className="arena-mesh" />
        <div className="arena-grid" />
        <div className="arena-orb arena-orb-1" />
        <div className="arena-orb arena-orb-2" />
        <div className="arena-orb arena-orb-3" />
        <div className="arena-noise" />
        {/* Game-specific decorative pattern */}
        <GamePattern pattern={tournament.pattern} accent={accent} secondary={sec} />
      </div>

      <main className="arena-content">
        {/* ─── Top status bar ─── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="arena-card-strong"
          style={{ borderRadius: 22, padding: '14px 22px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/tournaments" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(235,235,235,0.85)',
              textDecoration: 'none',
              fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s ease',
            }}>
              <iconify-icon icon="tabler:arrow-left" width="14" />
              All games
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12,
                background: `linear-gradient(135deg, ${accent}, ${sec})`,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 6px 20px -8px ${accent}`,
              }}>
                <iconify-icon icon={tournament.icon} width="22" style={{ color: '#0a0a0c' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Apex<span style={{ color: accent }}>Nova</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.50)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, animation: 'arenaDot 1.6s ease-in-out infinite' }} />
                  {tournament.label} lobby
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {user && (
              <>
                <Avatar url={user.avatar_url} name={user.name} size={38} accent={accent} glow />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.50)' }}>@{user.gamer_tag}</div>
                </div>
                <StatPill label="Rank" value={user.rank ? `#${user.rank}` : '—'} accent={accent} />
                <StatPill label="Points" value={(user.points || 0).toLocaleString()} accent="#fff" />
              </>
            )}
          </div>
        </motion.header>

        {/* ─── Game switcher row ─── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            padding: '12px 16px', marginBottom: 22,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.40)', marginRight: 4 }}>
            Switch game
          </span>
          {ALL_TOURNAMENT_CONFIGS.map((t) => (
            <GameSwitchChip key={t.id} tournament={t} isActive={t.id === tournament.id} navigate={navigate} accent={accent} />
          ))}
        </motion.div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: accent, animation: 'arena-spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(235,235,235,0.5)', fontSize: 13, fontFamily: MONO, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Syncing lobby…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="arena-card" style={{ padding: '16px 20px', color: '#f87171', display: 'flex', gap: 12, alignItems: 'center', borderColor: 'rgba(248,113,113,0.30)', background: 'rgba(248,113,113,0.08)' }}>
            <iconify-icon icon="tabler:alert-triangle" width="18" />
            <span>{error}</span>
            <button onClick={fetchOverview} style={{ marginLeft: 'auto', color: accent, background: 'none', border: `1px solid ${accent}40`, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18 }}
          >
            {/* ─── LEFT COLUMN ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ── Game-specific Hero ── */}
              <motion.div
                variants={fadeUp}
                className="arena-card-glow arena-scanline"
                style={{
                  borderRadius: 26, overflow: 'hidden', position: 'relative',
                  '--glow-color': `${accent}99`, '--glow-color-2': `${sec}66`,
                  '--scan-color': `${accent}25`,
                  padding: 0,
                  minHeight: 320,
                }}
              >
                {/* Hero image background */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  <img
                    src={tournament.lobbyHeroImage}
                    alt=""
                    aria-hidden
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      filter: 'saturate(1.2) contrast(1.05) brightness(0.42)',
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `
                      linear-gradient(165deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.68) 50%, rgba(6,6,8,0.45) 100%),
                      radial-gradient(ellipse 70% 60% at 0% 0%, ${accent}33, transparent 60%),
                      radial-gradient(ellipse 50% 50% at 100% 100%, ${sec}26, transparent 65%)
                    `,
                  }} />
                </div>

                {/* Top neon stripe */}
                <div style={{
                  position: 'relative', zIndex: 1,
                  height: 3, background: `linear-gradient(90deg, ${accent}, ${sec}, ${accent})`,
                }} />

                <div style={{ position: 'relative', zIndex: 1, padding: '36px 36px 32px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 999,
                      background: `${accent}14`, border: `1px solid ${accent}45`,
                      backdropFilter: 'blur(12px)',
                      fontFamily: MONO, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
                      textTransform: 'uppercase', color: accent,
                    }}>
                      <iconify-icon icon={tournament.iconAlt} width="11" />
                      Featured arena
                    </span>
                    {tournament.isLive && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 999,
                        background: `${sec}14`, border: `1px solid ${sec}45`,
                        fontFamily: MONO, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: sec,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sec, boxShadow: `0 0 8px ${sec}`, animation: 'arenaDot 1.4s ease-in-out infinite' }} />
                        Live
                      </span>
                    )}
                  </div>

                  <h1 style={{
                    margin: '0 0 8px', color: '#fff', fontWeight: 900,
                    fontSize: 'clamp(2.2rem, 4.2vw, 3.2rem)', letterSpacing: '-0.05em', lineHeight: 1.02,
                    textShadow: '0 4px 30px rgba(0,0,0,0.6)',
                  }}>
                    {tournament.label.split(' ').slice(0, -1).join(' ')}{' '}
                    <span style={{
                      background: `linear-gradient(105deg, ${accent}, #fff)`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontStyle: 'italic',
                    }}>{tournament.label.split(' ').slice(-1)}</span>
                  </h1>

                  <p style={{ margin: '0 0 6px', fontFamily: MONO, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: accent, textShadow: `0 0 20px ${accent}66` }}>
                    {tournament.tagline}
                  </p>
                  <p style={{ margin: '0 0 26px', color: 'rgba(235,235,235,0.65)', fontSize: 14, lineHeight: 1.6, maxWidth: 480 }}>
                    {tournament.description}
                  </p>

                  {/* CTA grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePlayNow}
                      style={{
                        position: 'relative',
                        padding: '20px 18px', borderRadius: 18,
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${accent}40`,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        transition: 'border-color 0.3s ease',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${accent}15`, border: `1px solid ${accent}40`,
                          display: 'grid', placeItems: 'center',
                          color: accent,
                        }}>
                          <iconify-icon icon="tabler:cpu" width="22" />
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.50)' }}>
                          Solo
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Vs Computer</div>
                      <div style={{ color: 'rgba(235,235,235,0.55)', fontSize: 12, marginBottom: 14 }}>Adaptive AI · score uploads</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayNow(); }}
                        className="arena-btn"
                        style={{ '--btn-color': accent, '--btn-color-2': sec, padding: '10px 16px', fontSize: 12, width: '100%', justifyContent: 'center' }}
                      >
                        <iconify-icon icon="tabler:player-play-filled" width="14" />
                        Start mission
                      </button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePlayFriend}
                      style={{
                        position: 'relative',
                        padding: '20px 18px', borderRadius: 18,
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${sec}40`,
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${sec}, transparent)` }} />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${sec}15`, border: `1px solid ${sec}40`,
                          display: 'grid', placeItems: 'center',
                          color: sec,
                        }}>
                          <iconify-icon icon="tabler:swords" width="22" />
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.50)' }}>
                          Versus
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Vs Friends</div>
                      <div style={{ color: 'rgba(235,235,235,0.55)', fontSize: 12, marginBottom: 14 }}>Real-time room · invite squad</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayFriend(); }}
                        className="arena-btn"
                        style={{ '--btn-color': sec, '--btn-color-2': accent, padding: '10px 16px', fontSize: 12, width: '100%', justifyContent: 'center' }}
                      >
                        <iconify-icon icon="tabler:users-plus" width="14" />
                        Create match
                      </button>
                    </motion.div>
                  </div>

                  {/* Mini stats strip */}
                  <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <StatPill label="Region" value="Global · 24ms" accent={accent} />
                    <StatPill label="Online" value={`${onlineCount + 4521} players`} accent="#fff" />
                    <StatPill label="Prize pool" value={tournament.prize || '$5,000'} accent={sec} />
                  </div>
                </div>
              </motion.div>

              {/* ── Leaderboard ── */}
              <motion.div variants={fadeUp} className="arena-card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <iconify-icon icon="tabler:trophy" width="18" style={{ color: accent }} />
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{tournament.label} leaderboard</span>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.50)', padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Best score
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <div style={{ padding: '40px 22px', color: 'rgba(235,235,235,0.40)', fontSize: 13, textAlign: 'center' }}>
                    No scores yet — be the first to set the bar.
                  </div>
                ) : (
                  <div style={{ padding: '8px 14px' }}>
                    <AnimatePresence>
                      {leaderboard.map((player, idx) => {
                        const isTop3 = player.rank <= 3;
                        const isSelf = player.id === user?.id;
                        return (
                          <motion.div
                            key={player.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`player-tile ${isSelf ? 'is-self' : ''}`}
                            style={{ marginBottom: 6 }}
                          >
                            <div style={{ width: 40, textAlign: 'center', display: 'grid', placeItems: 'center' }}>
                              {isTop3
                                ? <iconify-icon icon={player.rank === 1 ? 'tabler:medal' : player.rank === 2 ? 'tabler:medal-2' : 'tabler:award'} width="22" style={{ color: RANK_COLORS[player.rank - 1] }} />
                                : <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(235,235,235,0.4)', fontFamily: MONO }}>#{player.rank}</span>
                              }
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <Avatar url={player.avatar_url} name={player.name} size={36} accent={isSelf ? accent : '#fff'} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: isSelf ? accent : '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {player.name}
                                  </span>
                                  {isSelf && (
                                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${accent}15`, border: `1px solid ${accent}35`, color: accent, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)' }}>@{player.gamer_tag}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: isTop3 ? RANK_COLORS[player.rank - 1] : '#fff' }}>
                                {(player.score ?? player.best_score ?? 0).toLocaleString()}
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(235,235,235,0.30)', fontFamily: MONO }}>
                                {player.points?.toLocaleString()} pts
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ─── RIGHT COLUMN — Friends ─── */}
            <motion.div
              variants={fadeUp}
              className="arena-card"
              style={{ overflow: 'hidden', padding: 0, height: 'fit-content', position: 'sticky', top: 24 }}
            >
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <iconify-icon icon="tabler:users" width="18" style={{ color: accent }} />
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Friends</span>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.50)', padding: '3px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>{friends.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {onlineCount > 0 && (
                    <span style={{ fontSize: 11, color: sec, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: sec, boxShadow: `0 0 6px ${sec}` }} />
                      {onlineCount} online
                    </span>
                  )}
                  <button
                    onClick={() => setShowAddPanel((v) => !v)}
                    style={{
                      width: 30, height: 30, borderRadius: 10,
                      background: showAddPanel ? `${accent}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${showAddPanel ? `${accent}45` : 'rgba(255,255,255,0.10)'}`,
                      color: showAddPanel ? accent : 'rgba(235,235,235,0.7)',
                      cursor: 'pointer', display: 'grid', placeItems: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    title="Add friend"
                  >
                    <iconify-icon icon={showAddPanel ? 'tabler:x' : 'tabler:plus'} width="14" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {(showAddPanel || friends.length === 0) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden', borderBottom: friends.length > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                  >
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontSize: 12, color: 'rgba(235,235,235,0.50)', marginBottom: 10 }}>
                        Search by gamer tag or name to send a friend request.
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <input
                          value={addTag}
                          onChange={(e) => setAddTag(e.target.value)}
                          placeholder="e.g. testuser0001"
                          style={{
                            flex: 1, minWidth: 0,
                            borderRadius: 12,
                            border: '1px solid rgba(255,255,255,0.10)',
                            background: 'rgba(0,0,0,0.30)',
                            color: '#fff',
                            padding: '10px 13px', fontSize: 13,
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.2s ease',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = `${accent}55`)}
                          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                        />
                        <button
                          type="button"
                          onClick={() => submitAddFriend()}
                          disabled={addSubmitting || !addTag.trim()}
                          className="arena-btn"
                          style={{ '--btn-color': accent, '--btn-color-2': sec, padding: '10px 16px', fontSize: 13 }}
                        >
                          {addSubmitting ? '…' : 'Add'}
                        </button>
                      </div>
                      {addSearching && (
                        <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)', marginBottom: 6, fontFamily: MONO, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <iconify-icon icon="tabler:loader-2" width="12" style={{ animation: 'arena-spin 0.8s linear infinite' }} />
                          Searching…
                        </div>
                      )}
                      {addResults.length > 0 && addTag.trim().length >= 2 && (
                        <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                          {addResults.map((r) => (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => submitAddFriend(r.gamer_tag)}
                              disabled={addSubmitting}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', textAlign: 'left',
                                padding: '10px 12px',
                                border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: 'rgba(255,255,255,0.025)',
                                cursor: addSubmitting ? 'not-allowed' : 'pointer',
                                color: '#fff', transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}10`)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                            >
                              <Avatar url={r.avatar_url} name={r.name} size={32} accent={accent} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)' }}>@{r.gamer_tag} · tap to request</div>
                              </div>
                              <iconify-icon icon="tabler:user-plus" width="16" style={{ color: accent }} />
                            </button>
                          ))}
                        </div>
                      )}
                      {addErr && (
                        <div style={{ fontSize: 12, color: '#f87171', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <iconify-icon icon="tabler:alert-circle" width="14" />
                          {addErr}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {friends.length === 0 ? null : (
                <div style={{ padding: '8px 14px' }}>
                  <AnimatePresence>
                    {friends.map((friend, idx) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }} transition={{ delay: idx * 0.04 }}
                        className="player-tile"
                        style={{ marginBottom: 6 }}
                      >
                        <div style={{ position: 'relative' }}>
                          <Avatar url={friend.avatar_url} name={friend.name} size={42} accent={friend.status === 'online' ? sec : '#fff'} />
                          <div style={{
                            position: 'absolute', bottom: -1, right: -1,
                            width: 12, height: 12, borderRadius: '50%',
                            border: '2px solid #060608',
                            background: friend.status === 'online' ? sec : 'rgba(235,235,235,0.30)',
                            boxShadow: friend.status === 'online' ? `0 0 8px ${sec}` : 'none',
                          }} />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {friend.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)' }}>
                            @{friend.gamer_tag} · {(friend.points || 0).toLocaleString()} pts
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <motion.button
                            onClick={() => handleInvite(friend)}
                            disabled={inviteSent === friend.id}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            style={{
                              borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                              fontSize: 11, fontWeight: 800, fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase',
                              border: `1px solid ${inviteSent === friend.id ? `${sec}55` : `${accent}40`}`,
                              color: inviteSent === friend.id ? sec : accent,
                              background: inviteSent === friend.id ? `${sec}15` : `${accent}10`,
                              transition: 'all 0.2s ease',
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <iconify-icon icon={inviteSent === friend.id ? 'tabler:check' : 'tabler:swords'} width="12" />
                            {inviteSent === friend.id ? 'Sent' : 'Invite'}
                          </motion.button>
                          <motion.button
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={removingId === friend.id}
                            whileHover={{ scale: 1.10 }} whileTap={{ scale: 0.90 }}
                            title="Remove friend"
                            style={{
                              borderRadius: 10, padding: '6px 9px', cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(235,235,235,0.30)',
                              background: 'transparent', transition: 'all 0.2s ease',
                              display: 'grid', placeItems: 'center',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#f8717140'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.30)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            {removingId === friend.id ? <iconify-icon icon="tabler:loader-2" width="14" style={{ animation: 'arena-spin 0.8s linear infinite' }} /> : <iconify-icon icon="tabler:x" width="14" />}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </main>

      <style>{`
        @keyframes arena-spin { to { transform: rotate(360deg); } }
        @media (max-width: 920px) {
          .arena-content > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GameLobbyPage;
