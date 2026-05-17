import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';

const CYAN = '#00ffff';
const PINK = '#ff00ff';
const PURPLE = '#bd00ff';
const MONO = "'JetBrains Mono', monospace";

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

/* ── Avatar ─────────────────────────────────────── */
const Avatar = ({ url, name, size = 38, accent = CYAN, glow = false }) => (
  <div className={glow ? 'avatar-glow' : ''} style={{ '--av-color': accent, position: 'relative', flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: 8, overflow: 'hidden',
      background: `${accent}14`,
      border: `2px solid ${accent}55`,
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

/* ════════════════════════════════════════════════ */
const MemoryLobbyPage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

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

  const handlePlayNow = () => navigate('/memory-match-room?mode=solo');

  const handlePlayFriend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ game: 'memory' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/memory-match-room?mode=friend&room=${data.room.code}`);
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
        body: JSON.stringify({ friend_id: friend.id, game: 'memory' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send invite');
      setTimeout(() => navigate(`/memory-match-room?mode=friend&room=${data.room.code}`), 800);
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
  const { user, leaderboard, friends, game } = overview;

  return (
    <div
      className="arena-shell"
      style={{
        '--arena-bloom-1': `${CYAN}1c`,
        '--arena-bloom-2': `${PINK}18`,
        '--arena-bloom-3': `${PURPLE}14`,
        '--arena-bloom-4': 'rgba(56, 189, 248, 0.10)',
        '--arena-orb-1': `${CYAN}22`,
        '--arena-orb-2': `${PINK}22`,
        '--arena-orb-3': `${PURPLE}18`,
      }}
    >
      <div className="arena-bg-layer">
        <div className="arena-mesh" />
        <div className="arena-grid" />
        <div className="arena-orb arena-orb-1" />
        <div className="arena-orb arena-orb-2" />
        <div className="arena-orb arena-orb-3" />
        <div className="arena-noise" />
      </div>

      <main className="arena-content">
        {/* ─── Top status bar ─── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="arena-card-strong"
          style={{ borderRadius: 22, padding: '14px 22px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${CYAN}, ${PINK})`,
                display: 'grid', placeItems: 'center',
                boxShadow: `0 6px 20px -8px ${CYAN}`,
              }}>
                <span style={{ fontSize: 18 }}>🧩</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Apex<span style={{ color: CYAN }}>Nova</span> Memory
                </div>
                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.45)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
                  Pixel Memory Lobby
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/tournaments" className="arena-btn-ghost" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 14 }}>🏆</span>
              All tournaments
            </Link>
            {user && (
              <>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.10)' }} />
                <Avatar url={user.avatar_url} name={user.name} size={38} accent={CYAN} glow />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.50)' }}>@{user.gamer_tag}</div>
                </div>
                <StatPill label="Rank" value={user.rank ? `#${user.rank}` : '—'} accent={CYAN} />
                <StatPill label="Points" value={(user.points || 0).toLocaleString()} accent="#fff" />
              </>
            )}
          </div>
        </motion.header>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.08)', borderTopColor: CYAN, animation: 'arena-spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(235,235,235,0.5)', fontSize: 13, fontFamily: MONO, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Syncing memory grid…
            </span>
          </div>
        )}

        {!loading && error && (
          <div className="arena-card" style={{ padding: '16px 20px', color: '#f87171', display: 'flex', gap: 12, alignItems: 'center', borderColor: 'rgba(248,113,113,0.30)', background: 'rgba(248,113,113,0.08)' }}>
            <iconify-icon icon="lucide:alert-triangle" width="18" />
            <span>{error}</span>
            <button onClick={fetchOverview} style={{ marginLeft: 'auto', color: CYAN, background: 'none', border: `1px solid ${CYAN}40`, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
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

              {/* ── Hero card ── */}
              <motion.div
                variants={fadeUp}
                className="arena-card-glow arena-card arena-scanline"
                style={{
                  borderRadius: 26, overflow: 'hidden', position: 'relative',
                  '--glow-color': `${CYAN}99`, '--glow-color-2': `${PINK}66`,
                  '--scan-color': `${CYAN}25`,
                  padding: 0,
                }}
              >
                <div style={{ height: 3, background: `linear-gradient(90deg, ${CYAN}, ${PINK}, ${PURPLE})` }} />

                <div style={{ padding: '32px 34px 30px', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="arena-pill arena-pill-live" style={{ background: `${CYAN}14`, borderColor: `${CYAN}40`, color: CYAN }}>
                      <span className="arena-dot" /> Pixel arena
                    </span>
                    <span className="arena-pill" style={{ background: `${PINK}10`, borderColor: `${PINK}35`, color: PINK }}>
                      ● Live season
                    </span>
                  </div>

                  <h1 style={{
                    margin: '0 0 12px', color: '#fff', fontWeight: 900,
                    fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.05em', lineHeight: 1.05,
                  }}>
                    {game?.title || 'Pixel Memory'}{' '}
                    <span style={{
                      background: `linear-gradient(105deg, ${CYAN}, ${PINK})`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontStyle: 'italic',
                    }}>arena</span>
                  </h1>

                  <p style={{ margin: '0 0 28px', color: 'rgba(235,235,235,0.55)', fontSize: 15, lineHeight: 1.6, maxWidth: 480 }}>
                    Test your recall. Match pairs across escalating grids and climb the global memory rankings in real-time.
                  </p>

                  <div className="cta-row">
                    <motion.div
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePlayNow}
                      className="cta-tile"
                      style={{ '--cta-color': CYAN, '--cta-bloom': `${CYAN}1f` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${CYAN}15`, border: `1px solid ${CYAN}40`,
                          display: 'grid', placeItems: 'center',
                          color: CYAN, fontSize: 22,
                        }}>
                          <iconify-icon icon="tabler:robot" width="22" />
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)' }}>
                          Solo
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Play vs Computer</div>
                      <div style={{ color: 'rgba(235,235,235,0.50)', fontSize: 12, marginBottom: 14 }}>Adaptive AI · score submitted</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayNow(); }}
                        className="arena-btn"
                        style={{ '--btn-color': CYAN, '--btn-color-2': '#00b8d4', padding: '10px 18px', fontSize: 13 }}
                      >
                        Start mission
                      </button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handlePlayFriend}
                      className="cta-tile"
                      style={{ '--cta-color': PINK, '--cta-bloom': `${PINK}25` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${PINK}15`, border: `1px solid ${PINK}40`,
                          display: 'grid', placeItems: 'center',
                          color: PINK, fontSize: 22,
                        }}>
                          <iconify-icon icon="lucide:swords" width="22" />
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(235,235,235,0.45)' }}>
                          Versus
                        </span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Play with Friends</div>
                      <div style={{ color: 'rgba(235,235,235,0.50)', fontSize: 12, marginBottom: 14 }}>Real-time room · invite squad</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePlayFriend(); }}
                        className="arena-btn"
                        style={{ '--btn-color': PINK, '--btn-color-2': PURPLE, padding: '10px 18px', fontSize: 13, color: '#fff' }}
                      >
                        Create match
                      </button>
                    </motion.div>
                  </div>

                  <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <StatPill label="Region" value="Global · 24ms" accent={CYAN} />
                    <StatPill label="Online" value={`${onlineCount + 4521} players`} accent="#fff" />
                    <StatPill label="Best streak" value="14 pairs" accent={PINK} />
                  </div>
                </div>
              </motion.div>

              {/* ── Leaderboard ── */}
              <motion.div variants={fadeUp} className="arena-card" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🏆</span>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Memory leaderboard</span>
                  </div>
                  <span className="arena-pill" style={{ fontSize: 9 }}>Best score</span>
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
                            <div style={{ width: 36, textAlign: 'center' }}>
                              {isTop3
                                ? <span style={{ fontSize: 22, lineHeight: 1 }}>{RANK_LABELS[player.rank - 1]}</span>
                                : <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(235,235,235,0.4)', fontFamily: MONO }}>#{player.rank}</span>
                              }
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                              <Avatar url={player.avatar_url} name={player.name} size={36} accent={isSelf ? CYAN : '#fff'} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ color: isSelf ? CYAN : '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {player.name}
                                  </span>
                                  {isSelf && (
                                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, background: `${CYAN}15`, border: `1px solid ${CYAN}35`, color: CYAN, fontFamily: MONO, letterSpacing: '0.1em' }}>YOU</span>
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

            {/* ─── RIGHT COLUMN ─── */}
            <motion.div
              id="friends-list-section"
              variants={fadeUp}
              className="arena-card"
              style={{ overflow: 'hidden', padding: 0, height: 'fit-content', position: 'sticky', top: 24 }}
            >
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>👥</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Friends</span>
                  <span className="arena-pill" style={{ fontSize: 9 }}>{friends.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {onlineCount > 0 && (
                    <span style={{ fontSize: 11, color: PINK, display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: PINK, boxShadow: `0 0 6px ${PINK}` }} />
                      {onlineCount} online
                    </span>
                  )}
                  <button
                    onClick={() => setShowAddPanel((v) => !v)}
                    style={{
                      width: 30, height: 30, borderRadius: 10,
                      background: showAddPanel ? `${CYAN}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${showAddPanel ? `${CYAN}45` : 'rgba(255,255,255,0.10)'}`,
                      color: showAddPanel ? CYAN : 'rgba(235,235,235,0.7)',
                      cursor: 'pointer', display: 'grid', placeItems: 'center',
                      transition: 'all 0.2s ease', fontSize: 16,
                    }}
                    title="Add friend"
                  >
                    {showAddPanel ? '✕' : '+'}
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
                          onFocus={(e) => (e.target.style.borderColor = `${CYAN}55`)}
                          onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
                        />
                        <button
                          type="button"
                          onClick={() => submitAddFriend()}
                          disabled={addSubmitting || !addTag.trim()}
                          className="arena-btn"
                          style={{ '--btn-color': CYAN, '--btn-color-2': PINK, padding: '10px 16px', fontSize: 13 }}
                        >
                          {addSubmitting ? '…' : 'Add'}
                        </button>
                      </div>
                      {addSearching && (
                        <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)', marginBottom: 6, fontFamily: MONO, letterSpacing: '0.1em' }}>
                          ⟳ Searching…
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
                              onMouseEnter={(e) => (e.currentTarget.style.background = `${CYAN}10`)}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                            >
                              <Avatar url={r.avatar_url} name={r.name} size={32} accent={CYAN} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: 'rgba(235,235,235,0.40)' }}>@{r.gamer_tag} · tap to request</div>
                              </div>
                              <span style={{ fontSize: 11, color: CYAN, fontWeight: 700 }}>+ Add</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {addErr && (
                        <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>
                          ⚠ {addErr}
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
                          <Avatar url={friend.avatar_url} name={friend.name} size={42} accent={friend.status === 'online' ? PINK : '#fff'} />
                          <div style={{
                            position: 'absolute', bottom: -1, right: -1,
                            width: 12, height: 12, borderRadius: '50%',
                            border: '2px solid #060608',
                            background: friend.status === 'online' ? PINK : 'rgba(235,235,235,0.30)',
                            boxShadow: friend.status === 'online' ? `0 0 8px ${PINK}` : 'none',
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
                              border: `1px solid ${inviteSent === friend.id ? `${PINK}55` : `${CYAN}40`}`,
                              color: inviteSent === friend.id ? PINK : CYAN,
                              background: inviteSent === friend.id ? `${PINK}15` : `${CYAN}10`,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {inviteSent === friend.id ? '✓ Sent' : '⚔ Invite'}
                          </motion.button>
                          <motion.button
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={removingId === friend.id}
                            whileHover={{ scale: 1.10 }} whileTap={{ scale: 0.90 }}
                            title="Remove friend"
                            style={{
                              borderRadius: 10, padding: '6px 9px', cursor: 'pointer',
                              fontSize: 12, lineHeight: 1,
                              border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(235,235,235,0.30)',
                              background: 'transparent', transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#f8717140'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(235,235,235,0.30)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            {removingId === friend.id ? '…' : '✕'}
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

export default MemoryLobbyPage;
