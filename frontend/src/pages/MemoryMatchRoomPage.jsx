import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';
import { useRoomChannel } from '../hooks/useRoomChannel';
import PixelMemoryGame from '../components/PixelMemoryGame';
import RoomInvitePanel from '../components/RoomInvitePanel';
import Squares from '../components/Squares';
import { getTournamentConfig, syncSessionFromTournament } from '../data/tournamentConfig.js';

const CYAN = '#00ffff';
const PINK = '#ff00ff';
const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.09)' };
const font = { heading:"'Press Start 2P', monospace", mono:"'JetBrains Mono',monospace" };

const Avatar = ({ name, url, size=40 }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', background:'rgba(0,255,255,0.12)', border:`1.5px solid ${CYAN}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.4, fontWeight:700, color:CYAN, overflow:'hidden', flexShrink:0 }}>
    {url ? <img src={url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (name||'?').charAt(0).toUpperCase()}
  </div>
);

/* ═══════════════════════════════════════════
   PHASE 1 — MODE SELECTION
═══════════════════════════════════════════ */
const ModeSelection = ({ onSolo, onFriend, title }) => (
  <div style={{ maxWidth:700, margin:'0 auto', padding:'60px 24px' }}>
    <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} style={{ textAlign:'center', marginBottom:48 }}>
      <div style={{ fontSize:11, color:CYAN, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>{title}</div>
      <h1 style={{ margin:0, color:'#fff', fontSize:42, fontWeight:900, letterSpacing:'-0.04em' }}>Choose Your Mode</h1>
      <p style={{ color:'rgba(255,255,255,0.45)', marginTop:12, fontSize:15 }}>Select how you want to play today</p>
    </motion.div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
      {[
        { title:'Play vs Computer', desc:'Play solo and earn score. Submit to the global leaderboard.', icon:'🧩', cta:'Start Game', action:onSolo, accent:CYAN },
        { title:'Play with Friends', desc:'Invite friends from the Lobby to compete in real-time.', icon:'👥', cta:'Go to Lobby', action:onFriend, accent:PINK },
      ].map(({ title, desc, icon, cta, action, accent }) => (
        <motion.div key={title} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} whileHover={{y:-4,scale:1.02}} transition={{duration:0.3}}
          style={{ ...glass, borderRadius:20, overflow:'hidden', cursor:'pointer', position:'relative' }} onClick={action}>
          <div style={{ height:3, background:`linear-gradient(90deg,${accent},${PINK})` }}/>
          <div style={{ padding:'28px 26px' }}>
            <div style={{ fontSize:40, marginBottom:16 }}>{icon}</div>
            <h2 style={{ margin:'0 0 10px', color:'#fff', fontSize:20, fontWeight:800 }}>{title}</h2>
            <p style={{ margin:'0 0 24px', color:'rgba(255,255,255,0.5)', fontSize:14, lineHeight:1.6 }}>{desc}</p>
            <button style={{ border:'none', cursor:'pointer', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, background:`linear-gradient(135deg,${accent},${PINK})`, color:accent===CYAN?'#000':'#fff', boxShadow:`0 0 24px ${accent}40` }}>{cta}</button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   PHASE 2 — MATCH LOBBY (Friend Room)
═══════════════════════════════════════════ */
const MatchLobby = ({ token, user, initialRoomCode, onMatchStart, onBack, lobbyTitle }) => {
  const [roomCode, setRoomCode]   = useState(initialRoomCode || '');
  const [error, setError]         = useState('');
  const [msg, setMsg]             = useState('');
  const [sending, setSending]     = useState(false);
  const [starting, setStarting]   = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [friends, setFriends]     = useState([]);
  const [toastMsg, setToastMsg]   = useState('');
  const msgEndRef = useRef(null);
  const countdownStarted = useRef(false); // guard: prevent re-entry when room polls update

  const { room, setRoom, messages, setMessages } = useRoomChannel(roomCode || null);

  const api = useCallback(async (path, method='GET', body=null) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method, headers: authHeaders(token, body ? {'Content-Type':'application/json'} : {}),
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  }, [token]);

  useEffect(() => {
    if (roomCode) {
      api(`/rooms/${roomCode}/messages`).then(data => setMessages(data.messages || [])).catch(() => {});
      api(`/rooms/${roomCode}`).then(data => setRoom(data.room)).catch(() => setError('Failed to load room'));
      api(`/lobby/overview`).then(data => setFriends(data.friends || [])).catch(() => {});
    }
  }, [roomCode, api, setMessages, setRoom]);

  useEffect(() => {
    if (!roomCode) return undefined;
    // Poll room state every 2s — fallback when WebSocket isn't delivering
    const poll = setInterval(async () => {
      try {
        const data = await api(`/rooms/${roomCode}`);
        setRoom(data.room);
      } catch {
        /* silent fallback */
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [roomCode, api, setRoom]);

  // Poll chat messages every 3s — fallback for real-time chat
  // Deduplicates by message id so WS + poll never create duplicates
  useEffect(() => {
    if (!roomCode) return undefined;
    const pollChat = setInterval(async () => {
      try {
        const data = await api(`/rooms/${roomCode}/messages`);
        setMessages(data.messages || []);
      } catch {
        /* silent */
      }
    }, 3000);
    return () => clearInterval(pollChat);
  }, [roomCode, api, setMessages]);


  const toggleReady = async () => {
    setError('');
    try {
      const data = await api(`/rooms/${roomCode}/ready`,'POST');
      setRoom(data.room);
    } catch(e) { setError(e.message); }
  };

  const refreshRoom = async () => {
    if (!roomCode) return;
    try {
      const data = await api(`/rooms/${roomCode}`);
      setRoom(data.room);
    } catch(e) { setError('Failed to refresh room'); }
  };

  const startMatch = async () => {
    setStarting(true); setError('');
    try {
      await api(`/rooms/${roomCode}/start`,'POST');
    } catch(e) { setError(e.message); setStarting(false); }
  };

  const sendMsg = async () => {
    if (!msg.trim() || sending) return;
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, user_id: user.id, name: user.name, gamer_tag: user.gamer_tag, avatar_url: user.avatar_url, message: msg.trim(), created_at: new Date().toISOString(), isMe: true };
    setMessages(p => [...p, optimistic]);
    setMsg('');
    try {
      await api(`/rooms/${roomCode}/chat`, 'POST', { message: optimistic.message });
      // Replace optimistic with real messages from server (removes fake tempId)
      const data = await api(`/rooms/${roomCode}/messages`);
      setMessages(data.messages || []);
    } catch {
      // Keep optimistic on failure so user sees their own message
    }
    finally { setSending(false); }
  };

  // Watch for match.started via room state.
  // IMPORTANT: only depend on room?.status — NOT the room object itself.
  // The room object changes reference on every 2.5s poll, which would restart
  // the countdown over and over if included in the dependency array.
  const roomRef = useRef(room);
  useEffect(() => { roomRef.current = room; }, [room]);

  useEffect(() => {
    if (room?.status !== 'active') {
      countdownStarted.current = false;
      return;
    }
    if (countdownStarted.current) return;
    countdownStarted.current = true;
    setCountdown(3);
    let n = 3;
    const iv = setInterval(() => {
      n--;
      if (n === 0) {
        clearInterval(iv);
        setCountdown(null);
        onMatchStart(roomCode, roomRef.current);
      } else {
        setCountdown(n);
      }
    }, 1000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]); // ← only status, not room object

  useEffect(() => { msgEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const me = room?.players?.find(p => p.id === user?.id);
  const isHost = room?.players?.find(p => p.is_host)?.id === user?.id;
  const allReady = room?.players?.length > 1 && room?.players?.every(p => p.ready);

  if (!roomCode) return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <h2 style={{ color:'#fff', fontSize:28, fontWeight:800, marginBottom:8 }}>Match Lobby</h2>
      <p style={{ color:'rgba(255,255,255,0.45)', marginBottom:32 }}>Invalid or missing room code. Please invite friends from the Lobby.</p>
      <button onClick={onBack} style={{ background:`linear-gradient(135deg,${CYAN},${PINK})`, color:'#000', border:'none', borderRadius:12, padding:'14px 24px', fontSize:16, fontWeight:800, cursor:'pointer', boxShadow:`0 0 28px ${CYAN}30` }}>
        Return to Lobby
      </button>
    </div>
  );

  const leaveRoom = async () => {
    try {
      await fetch(`${API_BASE_URL}/rooms/${roomCode}/leave`, {
        method: 'POST',
        headers: authHeaders(token)
      });
    } catch(e) {}
    onBack();
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 24px' }}>
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 30, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{ position: 'fixed', top: 0, left: '50%', zIndex: 9999, background: 'rgba(0,255,255,0.1)', backdropFilter: 'blur(10px)', border: `1px solid ${CYAN}40`, padding: '12px 24px', borderRadius: 100, color: CYAN, fontWeight: 700, fontSize: 14, boxShadow: `0 10px 40px ${CYAN}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} style={{ background:'none', border:'none', color:CYAN, opacity:0.6, cursor:'pointer', padding:0, marginLeft:8, fontSize:14 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {countdown !== null && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(6,6,8,0.92)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
            <div style={{ fontSize:13, color:CYAN, textTransform:'uppercase', letterSpacing:'0.14em' }}>Match Starting</div>
            <motion.div key={countdown} initial={{scale:1.8,opacity:0}} animate={{scale:1,opacity:1}}
              style={{ fontSize:110, fontWeight:900, color:CYAN, lineHeight:1, textShadow:`0 0 80px ${CYAN}60` }}>{countdown}</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>{lobbyTitle}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginTop:4 }}>Waiting for players to ready up...</div>
        </div>
        {error && <div style={{ color:'#f87171', fontSize:13 }}>{error}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={refreshRoom} style={{ color:CYAN, background:'rgba(0,255,255,0.05)', border:`1px solid ${CYAN}40`, borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13, fontWeight:700 }}>⟳ Refresh</button>
          <button onClick={leaveRoom} style={{ color:'rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontSize:13 }}>Leave Lobby</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px 300px', gap:16 }}>
        {/* Players */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...glass, borderRadius:16, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', color:'#fff', fontWeight:700 }}>Players ({room?.players?.length || 0}/4)</div>
            {(room?.players || []).map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', background: p.id===user?.id ? 'rgba(0,255,255,0.03)' : 'transparent' }}>
                <Avatar name={p.name} url={p.avatar_url} size={38}/>
                <div style={{ flex:1 }}>
                  <div style={{ color: p.id===user?.id ? CYAN : '#fff', fontWeight:600, fontSize:14 }}>{p.name} {p.is_host && <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>HOST</span>}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)' }}>@{p.gamer_tag}</div>
                </div>
                <div style={{ fontSize:11, fontWeight:700, borderRadius:100, padding:'4px 12px', background: p.ready ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: p.ready ? PINK : 'rgba(255,255,255,0.4)', border:`1px solid ${p.ready ? PINK+'40' : 'rgba(255,255,255,0.1)'}` }}>
                  {p.ready ? '✓ Ready' : 'Waiting'}
                </div>
              </div>
            ))}
            {(room?.players?.length || 0) < 4 && (
              <div style={{ padding:'14px 18px', color:'rgba(255,255,255,0.2)', fontSize:13, fontStyle:'italic' }}>Waiting for players to join...</div>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={toggleReady} style={{ flex:1, padding:'14px', borderRadius:12, border:'none', cursor:'pointer', background: me?.ready ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,${CYAN},${PINK})`, color: me?.ready ? '#fff' : '#000', fontWeight:800, fontSize:15 }}>
              {me?.ready ? 'Cancel Ready' : '✓ Ready Up'}
            </button>
            {isHost && (
              <button onClick={startMatch} disabled={!allReady||starting} style={{ flex:1, padding:'14px', borderRadius:12, border:'none', cursor: allReady?'pointer':'not-allowed', background: allReady ? PINK : 'rgba(255,255,255,0.06)', color:'#fff', fontWeight:800, fontSize:15, opacity: allReady?1:0.5 }}>
                {starting ? 'Starting…' : '▶ Start Match'}
              </button>
            )}
          </div>
        </div>

        {/* Chat */}
        <div style={{ ...glass, borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', height:420 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', color:'#fff', fontWeight:700, fontSize:14 }}>💬 Room Chat</div>
          <div style={{ flex:1, overflowY:'auto', padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {messages.length === 0 && <div style={{ color:'rgba(255,255,255,0.25)', fontSize:12, textAlign:'center', marginTop:16 }}>No messages yet</div>}
            {messages.map((m,i) => (
              <div key={m.id||i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                <Avatar name={m.name} url={m.avatar_url} size={22}/>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color: m.user_id===user?.id ? CYAN : `hsl(${(i*55)%360},65%,70%)` }}>{m.name} </span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>{m.message}</span>
                </div>
              </div>
            ))}
            <div ref={msgEndRef}/>
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8 }}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()}
              placeholder="Say something…" style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 10px', color:'#fff', fontSize:12, fontFamily:font.heading, outline:'none' }}/>
            <button onClick={sendMsg} disabled={sending} style={{ background:CYAN, border:'none', borderRadius:8, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>

        <RoomInvitePanel
          token={token}
          roomCode={roomCode}
          user={user}
          friends={friends}
          room={room}
          accent={CYAN}
          secondary={PINK}
          fontFamily={font.heading}
          onInviteSent={(name) => {
            setToastMsg(`Invite sent to ${name}!`);
            setTimeout(() => setToastMsg(''), 4000);
          }}
          onInviteError={(msg) => setError(msg)}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   PHASE 3 — GAME SCREEN
═══════════════════════════════════════════ */
const GameScreen = ({ token, user, roomCode, isSolo, onFinished }) => {
  const [submitted, setSubmitted] = useState(false);
  const { room } = useRoomChannel(roomCode);

  useEffect(() => {
    if (room?.status === 'finished' && !isSolo) onFinished(room);
  }, [room?.status]);

  const handleGameOver = useCallback(async (score) => {
    if (submitted) return;
    setSubmitted(true);
    try {
      if (isSolo) {
        const res = await fetch(`${API_BASE_URL}/profile/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score, game: 'memory' }),
        });
        const data = await res.json();
        onFinished({ status: 'finished', players: [{ id: user?.id, name: user?.name, avatar_url: user?.avatar_url, score, is_host: true }], points_earned: data.points_earned });
      } else if (roomCode) {
        const res = await fetch(`${API_BASE_URL}/rooms/${roomCode}/score`, {
          method: 'POST',
          headers: authHeaders(token, { 'Content-Type': 'application/json' }),
          body: JSON.stringify({ score }),
        });
        const data = await res.json();
        if (data.finished) onFinished(data.room);
      }
    } catch { onFinished(null); }
  }, [submitted, isSolo, roomCode, token, user, onFinished]);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px', minHeight:'100vh', justifyContent:'center' }}>
      <PixelMemoryGame playerName={user?.name || 'You'} onGameOver={handleGameOver} autoStart={true} allowRestart={isSolo} />
      {submitted && !isSolo && (
        <div style={{ marginTop:16, color:CYAN, fontSize:13 }}>Score submitted! Waiting for others…</div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   PHASE 4 — RESULTS
═══════════════════════════════════════════ */
const ResultScreen = ({ room, user, onPlayAgain, onLobby, roomCode }) => {
  const { room: liveRoom } = useRoomChannel(roomCode, room);

  useEffect(() => {
    if (liveRoom?.status === 'waiting') {
      onPlayAgain(true);
    }
  }, [liveRoom?.status, onPlayAgain]);

  const players = [...(room?.players || [])].sort((a,b) => (b.score||0)-(a.score||0));
  const winner  = players[0];

  return (
    <div style={{ maxWidth:560, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}>
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}>
        <div style={{ fontSize:48, marginBottom:16 }}>🏆</div>
        <h2 style={{ color:'#fff', fontSize:32, fontWeight:900, marginBottom:4 }}>Match Over</h2>
        <div style={{ color:'rgba(255,255,255,0.45)', marginBottom:32 }}>Final Scores</div>

        <div style={{ ...glass, borderRadius:18, overflow:'hidden', marginBottom:24 }}>
          {players.map((p,i) => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', background: p.id===user?.id ? 'rgba(0,255,255,0.04)' : i===0 ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
              <div style={{ fontSize:20, width:28 }}>{['🥇','🥈','🥉','4️⃣'][i]}</div>
              <Avatar name={p.name} url={p.avatar_url} size={36}/>
              <div style={{ flex:1, textAlign:'left' }}>
                <div style={{ color: p.id===user?.id ? CYAN : '#fff', fontWeight:700 }}>{p.name} {p.id===user?.id && <span style={{fontSize:10, color:CYAN}}>(You)</span>}</div>
              </div>
              <div style={{ fontFamily:font.mono, fontSize:20, fontWeight:800, color: i===0 ? '#FFD700' : '#fff' }}>{(p.score||0).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {winner && (
          <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:28, fontSize:14 }}>
            🎉 <strong style={{color:'#FFD700'}}>{winner.name}</strong> wins with {(winner.score||0).toLocaleString()} points!
          </div>
        )}

        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <button onClick={() => onPlayAgain(false)} style={{ background:`linear-gradient(135deg,${CYAN},${PINK})`, color:'#000', border:'none', borderRadius:12, padding:'12px 28px', fontWeight:800, fontSize:15, cursor:'pointer' }}>Play Again</button>
          <button onClick={onLobby} style={{ background:'rgba(255,255,255,0.07)', color:'#fff', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'12px 28px', fontWeight:700, fontSize:15, cursor:'pointer' }}>Back to Lobby</button>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ROOT — MATCH ROOM PAGE
═══════════════════════════════════════════ */
const MemoryMatchRoomPage = () => {
  const { token, user } = useAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const tournamentIdRaw = searchParams.get('tournament') || 'pixel-memory-ultra';
  const tournament      = getTournamentConfig(tournamentIdRaw);

  useEffect(() => {
    syncSessionFromTournament(tournamentIdRaw);
  }, [tournamentIdRaw]);

  const initMode        = searchParams.get('mode'); // 'solo' | 'friend' | null
  const initRoom        = searchParams.get('room') || '';

  const [phase, setPhase]       = useState(() => initMode === 'solo' ? 'playing' : initMode === 'friend' ? 'lobby' : 'select');
  const [roomCode, setRoomCode] = useState(initRoom);
  const [roomData, setRoomData] = useState(null);
  const [isSolo, setIsSolo]     = useState(initMode === 'solo');

  const roomCodeRef = useRef(roomCode);
  const isSoloRef = useRef(isSolo);

  useEffect(() => {
    roomCodeRef.current = roomCode;
    isSoloRef.current = isSolo;
  }, [roomCode, isSolo]);

  useEffect(() => {
    const leave = () => {
      if (roomCodeRef.current && !isSoloRef.current && token) {
        // Use sendBeacon for reliable delivery on page unload (avoids CORS preflight drop)
        navigator.sendBeacon(`${API_BASE_URL}/rooms/${roomCodeRef.current}/leave?token=${token}`);
      }
    };
    window.addEventListener('beforeunload', leave);
    window.addEventListener('popstate', leave);
    return () => {
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('popstate', leave);
    };
  }, [token]);

  const goLobby = () => {
    if (roomCodeRef.current && !isSoloRef.current && token) {
      navigator.sendBeacon(`${API_BASE_URL}/rooms/${roomCodeRef.current}/leave?token=${token}`);
    }
    navigate('/memory-lobby');
  };

  const handleSolo = async () => {
    setIsSolo(true);
    setRoomCode('');
    setRoomData(null);
    setPhase('playing');
  };

  const handleFriend = () => { navigate('/memory-lobby'); };

  const handleMatchStart = (code, room) => { setRoomCode(code); setRoomData(room); setPhase('playing'); };

  const handleFinished = (room) => { setRoomData(room); setPhase('result'); };

  const handlePlayAgain = async (autoReset = false) => {
    if (isSolo) {
      setPhase('playing');
    } else if (roomCode) {
      if (autoReset !== true) {
        try {
          await fetch(`${API_BASE_URL}/rooms/${roomCode}/play-again`, {
            method: 'POST',
            headers: authHeaders(token)
          });
        } catch(e) {}
      }
      setPhase('lobby');
    } else {
      setPhase('select');
    }
  };
  return (
    <div style={{ minHeight:'100vh', background:'#060608', position:'relative', overflow:'hidden', fontFamily:font.heading }}>
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <Squares direction="diagonal" speed={0.12} squareSize={56} borderColor="rgba(255,255,255,0.02)" hoverFillColor="rgba(204,255,0,0.04)"/>
      </div>

      {/* Top bar */}
      <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(6,6,8,0.8)', backdropFilter:'blur(12px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:tournament.accent, boxShadow:`0 0 10px ${tournament.accent}` }}/>
          <span style={{ color:tournament.accent, fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:'0.1em' }}>{tournament.emoji} {tournament.label}</span>
        </div>
        <button onClick={goLobby} style={{ color:'rgba(255,255,255,0.4)', background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13 }}>← Lobby</button>
      </div>

      <div style={{ position:'relative', zIndex:1 }}>
        <AnimatePresence mode="wait">
          {phase === 'select' && (
            <motion.div key="select" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
              <ModeSelection onSolo={handleSolo} onFriend={handleFriend} title={tournament.label}/>
            </motion.div>
          )}
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
              <MatchLobby token={token} user={user} initialRoomCode={roomCode} lobbyTitle={`${tournament.label} Lobby`} onMatchStart={handleMatchStart} onBack={()=>{setPhase('select'); setRoomCode('');}}/>
            </motion.div>
          )}
          {phase === 'playing' && (
            <motion.div key="playing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <GameScreen token={token} user={user} roomCode={roomCode} isSolo={isSolo} onFinished={handleFinished}/>
            </motion.div>
          )}
          {phase === 'result' && (
            <motion.div key="result" initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
              <ResultScreen room={roomData} user={user} onPlayAgain={handlePlayAgain} onLobby={goLobby} roomCode={roomCode}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
};

export default MemoryMatchRoomPage;
