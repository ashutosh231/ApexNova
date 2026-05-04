import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Squares from '../components/Squares';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';

const LIME = '#00ffff';
const GREEN = '#ff00ff';
const PURPLE = '#a855f7';

const glass = {
  background: 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const glassStrong = {
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.12)',
};

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_LABELS = ['🥇', '🥈', '🥉'];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

/* ── Avatar helper ────────────────────────────── */
const Avatar = ({ url, name, size = 38, lime = false }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    background: 'rgba(204,255,0,0.1)', border: `1.5px solid ${lime ? LIME + '60' : 'rgba(255,255,255,0.12)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: size * 0.4, fontWeight: 700, color: LIME,
  }}>
    {url
      ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : (name?.charAt(0) || '?').toUpperCase()
    }
  </div>
);

/* ── Stat Pill ────────────────────────────────── */
const StatPill = ({ label, value, accent }) => (
  <div style={{ ...glass, borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 700, color: accent || '#fff' }}>{value}</span>
  </div>
);

/* ══════════════════════════════════════════════ */
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
    if (!token) return;
    const q = addTag.trim();
    if (q.length < 2) {
      setAddResults([]);
      return;
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

  const handlePlayNow  = () => navigate('/memory-match-room?mode=solo');
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
      
      setTimeout(() => {
        navigate(`/memory-match-room?mode=friend&room=${data.room.code}`);
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

  const onlineCount = useMemo(() => overview.friends.filter(f => f.status === 'online').length, [overview.friends]);
  const { user, leaderboard, friends, game } = overview;

  return (
    <div style={{ minHeight:'100vh', background:'#060608', position:'relative', overflow:'hidden', fontFamily:"'Space Grotesk', sans-serif" }}>
      {/* ── Advanced background ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        {/* Mesh gradient base */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse 90% 55% at 50% -10%, rgba(204,255,0,0.11) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 90% 110%, rgba(168,85,247,0.09) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 0% 60%, rgba(16,185,129,0.06) 0%, transparent 60%)' }}/>
        {/* Grid lines */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg width='56' height='56' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M56 0v56M0 0h56' stroke='rgba(255,255,255,0.022)' stroke-width='.5'/%3E%3C/svg%3E")`, backgroundSize:'56px 56px' }}/>
        {/* Animated orbs */}
        <div style={{ position:'absolute', top:'6%', left:'14%', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(204,255,0,0.08) 0%, transparent 70%)', filter:'blur(50px)', animation:'orb1 10s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', bottom:'8%', right:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', filter:'blur(44px)', animation:'orb2 13s ease-in-out infinite 4s' }}/>
        <div style={{ position:'absolute', top:'50%', left:'60%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', filter:'blur(36px)', animation:'orb3 16s ease-in-out infinite 7s' }}/>
        {/* Squares interactive layer */}
        <Squares direction="diagonal" speed={0.09} squareSize={56} borderColor="rgba(255,255,255,0.018)" hoverFillColor="rgba(204,255,0,0.05)"/>
      </div>

      <main style={{ maxWidth:1240, margin:'0 auto', padding:'24px 24px 80px', position:'relative', zIndex:1 }}>

        {/* ── Header ─────────────────────────────── */}
        <motion.header initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ ...glassStrong, borderRadius: 18, padding: '14px 22px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: LIME, boxShadow: `0 0 10px ${LIME}`, animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: LIME, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pixel Memory Ultra</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: 100 }}>Season Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link to="/tournaments" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = LIME; e.currentTarget.style.borderColor = LIME + '40'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              🏆 Tournaments
            </Link>
            {user && (
              <>
                <Avatar url={user.avatar_url} name={user.name} size={36} lime />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>@{user.gamer_tag}</div>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
                <StatPill label="Rank" value={user.rank ? `#${user.rank}` : '—'} accent={LIME} />
                <StatPill label="Points" value={(user.points || 0).toLocaleString()} accent="#fff" />
              </>
            )}
          </div>
        </motion.header>

        {/* ── Loading / Error ─────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '80px 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.1)`, borderTopColor: LIME, animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading lobby data…</span>
          </div>
        )}
        {!loading && error && (
          <div style={{ ...glass, borderRadius: 14, padding: '16px 20px', color: '#f87171', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>⚠</span> {error}
            <button onClick={fetchOverview} style={{ marginLeft: 'auto', color: LIME, background: 'none', border: `1px solid ${LIME}40`, borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 12 }}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

            {/* ── LEFT COLUMN ─────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Pixel Memory Ultra Hero Card */}
              <motion.div variants={fadeUp}
                style={{ ...glass, borderRadius: 22, overflow: 'hidden', position: 'relative' }}>
                {/* Top neon stripe */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${LIME}, ${GREEN}, ${PURPLE})` }} />
                <div style={{ padding: '28px 32px 32px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: LIME, background: 'rgba(204,255,0,0.1)', border: `1px solid ${LIME}30`, borderRadius: 100, padding: '3px 10px' }}>Featured Game</span>
                    <span style={{ fontSize: 11, color: GREEN, background: 'rgba(16,185,129,0.1)', border: `1px solid ${GREEN}30`, borderRadius: 100, padding: '3px 10px' }}>● Live Season</span>
                  </div>

                  <h1 style={{ margin: '0 0 10px', color: '#fff', fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Pixel Memory Ultra
                  </h1>
                  <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, maxWidth: 440 }}>
                    Competitive season is live. Test your memory, outsmart your friends, and climb the global rankings in real-time matches.
                  </p>

                  {/* 2 CTA Cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                    {[
                      { label:'Play vs Computer', desc:'Play solo and earn score', icon:'🧩', cta:'Start Game', action:handlePlayNow, accent:LIME },
                      { label:'Play with Friends', desc:'Invite friends in real-time', icon:'👥', cta:'Create Match', action:handlePlayFriend, accent:PURPLE },
                    ].map(({label,desc,icon,cta,action,accent}) => (
                      <motion.div key={label} whileHover={{scale:1.03,y:-3}} whileTap={{scale:0.98}} onClick={action}
                        style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${accent}30`, borderRadius:14, padding:'18px 16px', cursor:'pointer', position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${accent},${GREEN})` }}/>
                        <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
                        <div style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:4 }}>{label}</div>
                        <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12, marginBottom:14 }}>{desc}</div>
                        <button onClick={e=>{e.stopPropagation();action();}} style={{ border:'none', cursor:'pointer', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:700, background:`linear-gradient(135deg,${accent},${GREEN})`, color:accent===LIME?'#000':'#fff' }}>{cta}</button>
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, background:`radial-gradient(circle, ${LIME}12, transparent 70%)`, pointerEvents:'none' }}/>
              </motion.div>

              {/* Leaderboard */}
              <motion.div variants={fadeUp} style={{ ...glass, borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🏆</span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Global Leaderboard</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Best Score</span>
                </div>

                {leaderboard.length === 0 ? (
                  <div style={{ padding: '32px 22px', color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center' }}>
                    No scores yet — be the first to play!
                  </div>
                ) : (
                  <AnimatePresence>
                    {leaderboard.map((player, idx) => {
                      const isTop3 = player.rank <= 3;
                      const isSelf = player.id === user?.id;
                      return (
                        <motion.div key={player.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          style={{
                            display: 'grid', gridTemplateColumns: '44px 40px 1fr auto',
                            alignItems: 'center', gap: 10, padding: '11px 22px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isSelf ? 'rgba(204,255,0,0.04)' : 'transparent',
                            borderLeft: isSelf ? `2px solid ${LIME}60` : '2px solid transparent',
                          }}>
                          {/* Rank */}
                          <div style={{ textAlign: 'center' }}>
                            {isTop3
                              ? <span style={{ fontSize: 20, lineHeight: 1 }}>{RANK_LABELS[player.rank - 1]}</span>
                              : <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: "'JetBrains Mono', monospace" }}>#{player.rank}</span>
                            }
                          </div>
                          <Avatar url={player.avatar_url} name={player.name} size={34} />
                          <div>
                            <div style={{ color: isSelf ? LIME : '#fff', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {player.name}
                              {isSelf && <span style={{ fontSize: 10, color: LIME, background: 'rgba(204,255,0,0.1)', border: `1px solid ${LIME}30`, borderRadius: 100, padding: '1px 7px' }}>You</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>@{player.gamer_tag}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: isTop3 ? RANK_COLORS[player.rank - 1] : '#fff', fontFamily: "'JetBrains Mono', monospace" }}>
                              {(player.score ?? player.best_score ?? 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{player.points?.toLocaleString()} pts</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN ────────────────────── */}
            <motion.div id="friends-list-section" variants={fadeUp} style={{ ...glass, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
              {/* Friends header */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>👥</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Friends</span>
                  <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', borderRadius: 100, padding: '2px 9px', color: 'rgba(255,255,255,0.45)' }}>{friends.length}</span>
                </div>
                {onlineCount > 0 && (
                  <span style={{ fontSize: 11, color: GREEN, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />
                    {onlineCount} online
                  </span>
                )}
              </div>



              {/* Friends List */}
              {friends.length === 0 ? (
                <div style={{ padding: '16px 18px 24px' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>No friends yet — search by gamer tag or name, then send a request.</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={addTag}
                      onChange={(e) => setAddTag(e.target.value)}
                      placeholder="e.g. testuser0001"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.25)',
                        color: '#fff',
                        padding: '9px 12px',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => submitAddFriend()}
                      disabled={addSubmitting || !addTag.trim()}
                      style={{
                        borderRadius: 10,
                        border: `1px solid ${LIME}45`,
                        color: '#000',
                        background: addSubmitting || !addTag.trim() ? 'rgba(0,255,255,0.35)' : LIME,
                        padding: '9px 14px',
                        cursor: addSubmitting || !addTag.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {addSubmitting ? '…' : 'Add'}
                    </button>
                  </div>
                  {addSearching && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Searching…</div>}
                  {addResults.length > 0 && addTag.trim().length >= 2 && (
                    <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                      {addResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => submitAddFriend(r.gamer_tag)}
                          disabled={addSubmitting}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.03)',
                            cursor: addSubmitting ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Avatar url={r.avatar_url} name={r.name} size={30} lime />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>@{r.gamer_tag} · tap to request</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {addErr && <div style={{ fontSize: 12, color: '#f87171' }}>{addErr}</div>}
                </div>
              ) : (
                <AnimatePresence>
                  {friends.map((friend, idx) => (
                    <motion.div key={friend.id}
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }} transition={{ delay: idx * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar url={friend.avatar_url} name={friend.name} size={38} />
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                          borderRadius: '50%', border: '2px solid #060608',
                          background: friend.status === 'online' ? GREEN : 'rgba(255,255,255,0.25)',
                        }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{friend.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>@{friend.gamer_tag} · {(friend.points || 0).toLocaleString()} pts</div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <motion.button
                          onClick={() => handleInvite(friend)}
                          disabled={inviteSent === friend.id}
                          whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                          style={{
                            borderRadius: 8, padding: '5px 11px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            border: `1px solid ${inviteSent === friend.id ? GREEN + '60' : LIME + '35'}`,
                            color: inviteSent === friend.id ? GREEN : LIME,
                            background: inviteSent === friend.id ? `${GREEN}15` : `${LIME}10`,
                            transition: 'all 0.25s',
                          }}>
                          {inviteSent === friend.id ? '✓ Sent' : 'Invite'}
                        </motion.button>
                        <motion.button
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={removingId === friend.id}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          title="Remove friend"
                          style={{
                            borderRadius: 8, padding: '5px 8px', cursor: 'pointer', fontSize: 13,
                            border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)',
                            background: 'transparent', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#f8717140'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                          {removingId === friend.id ? '…' : '✕'}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 10px #00ffff} 50%{opacity:0.6;box-shadow:0 0 20px #00ffff} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes orb1  { 0%,100%{transform:translate(0,0) scale(1);opacity:0.5} 50%{transform:translate(30px,-25px) scale(1.1);opacity:0.8} }
        @keyframes orb2  { 0%,100%{transform:translate(0,0) scale(1);opacity:0.4} 50%{transform:translate(-20px,20px) scale(1.08);opacity:0.7} }
        @keyframes orb3  { 0%,100%{transform:translate(0,0) scale(1);opacity:0.3} 50%{transform:translate(15px,-15px) scale(1.12);opacity:0.6} }
      `}</style>
    </div>
  );
};

export default MemoryLobbyPage;
