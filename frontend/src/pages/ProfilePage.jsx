import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, authHeaders } from '../lib/api';

const LIME = '#ccff00'; const GREEN = '#10b981'; const PURPLE = '#a855f7';
const glass = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.09)' };
const font = { heading:"'Space Grotesk',sans-serif", mono:"'JetBrains Mono',monospace" };

const Av = ({ url, name, size=40 }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'rgba(204,255,0,0.1)', border:`1.5px solid ${LIME}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.4, fontWeight:700, color:LIME }}>
    {url ? <img src={url} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : (name||'?').charAt(0).toUpperCase()}
  </div>
);

const Stat = ({ label, value, sub, accent }) => (
  <div style={{ ...glass, borderRadius:16, padding:'18px 20px', flex:1, minWidth:0 }}>
    <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:800, color:accent||'#fff', fontFamily:font.mono, letterSpacing:'-0.02em' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{sub}</div>}
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</label>
    <input {...props} style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:14, fontFamily:font.heading, outline:'none', width:'100%', boxSizing:'border-box', ...props.style }}
      onFocus={e=>e.target.style.borderColor=LIME+'60'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
  </div>
);

const Btn = ({ children, loading, accent=LIME, outline, ...props }) => (
  <button {...props} style={{ border: outline ? `1px solid ${accent}40` : 'none', cursor:'pointer', borderRadius:10, padding:'10px 22px', fontSize:14, fontWeight:700, background: outline ? 'transparent' : `linear-gradient(135deg,${accent},${GREEN})`, color: outline ? accent : accent===LIME?'#000':'#fff', opacity: loading ? 0.6 : 1, fontFamily:font.heading, ...props.style }}>
    {loading ? '…' : children}
  </button>
);

/* ═══════════ SETTINGS MODAL ══════════ */
const SettingsModal = ({ token, user, onClose, onUpdated }) => {
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [gamerTag, setGamerTag] = useState(user?.gamer_tag || '');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text:'', ok:true });

  const save = async () => {
    setSaving(true); setMsg({ text:'', ok:true });
    try {
      if (tab === 'profile') {
        const res = await fetch(`${API_BASE_URL}/profile/update`, {
          method:'PATCH', headers: authHeaders(token, {'Content-Type':'application/json'}),
          body: JSON.stringify({ name, gamer_tag: gamerTag }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed');
        setMsg({ text:'Profile updated!', ok:true });
        onUpdated(d.user);
      } else {
        if (newPass !== confirmPass) throw new Error('Passwords do not match');
        const res = await fetch(`${API_BASE_URL}/profile/change-password`, {
          method:'POST', headers: authHeaders(token, {'Content-Type':'application/json'}),
          body: JSON.stringify({ current_password: curPass, new_password: newPass, new_password_confirmation: confirmPass }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed');
        setMsg({ text:'Password changed!', ok:true });
        setCurPass(''); setNewPass(''); setConfirmPass('');
      }
    } catch(e) { setMsg({ text: e.message, ok:false }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(6,6,8,0.88)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onClick={onClose}>
      <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
        style={{ ...glass, borderRadius:22, width:'100%', maxWidth:460, overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ height:3, background:`linear-gradient(90deg,${LIME},${PURPLE})` }}/>
        <div style={{ padding:'22px 26px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ margin:0, color:'#fff', fontSize:20, fontWeight:800 }}>⚙ Settings</h2>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:20, cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:22 }}>
            {['profile','password'].map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'8px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:700, background: tab===t ? LIME : 'rgba(255,255,255,0.06)', color: tab===t ? '#000' : 'rgba(255,255,255,0.5)' }}>
                {t === 'profile' ? '👤 Edit Profile' : '🔒 Change Password'}
              </button>
            ))}
          </div>

          {tab === 'profile' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Display Name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
              <Input label="Gamer Tag" value={gamerTag} onChange={e=>setGamerTag(e.target.value)} placeholder="@handle"/>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <Input label="Current Password" type="password" value={curPass} onChange={e=>setCurPass(e.target.value)}/>
              <Input label="New Password" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
              <Input label="Confirm New Password" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}/>
            </div>
          )}

          {msg.text && <div style={{ marginTop:14, fontSize:13, color: msg.ok ? GREEN : '#f87171', padding:'8px 12px', borderRadius:8, background: msg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(248,113,113,0.08)', border:`1px solid ${msg.ok ? GREEN+'30' : '#f8717130'}` }}>{msg.text}</div>}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:22 }}>
            <Btn outline onClick={onClose}>Cancel</Btn>
            <Btn loading={saving} onClick={save}>Save Changes</Btn>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ═══════════ MAIN PROFILE PAGE ══════════ */
const ProfilePage = () => {
  const { token, logout, updateUser, user: authUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [inviteSent, setInviteSent] = useState(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [gamerTagInput, setGamerTagInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState({ msg: '', ok: true });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    if (!gamerTagInput.trim() || gamerTagInput.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API_BASE_URL}/lobby/friends/search?q=${encodeURIComponent(gamerTagInput.trim())}`, { headers: authHeaders(token) });
        if (res.ok) setSearchResults(await res.json());
      } catch {} finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(delay);
  }, [gamerTagInput, token]);

  const handleAcceptRequest = async (senderId) => {
    setProcessingRequest(senderId);
    try {
      await fetch(`${API_BASE_URL}/lobby/friends/accept`, { method:'POST', headers: authHeaders(token, {'Content-Type':'application/json'}), body: JSON.stringify({ sender_id: senderId }) });
      load();
    } catch {} finally { setProcessingRequest(null); }
  };

  const handleRejectRequest = async (senderId) => {
    setProcessingRequest(senderId);
    try {
      await fetch(`${API_BASE_URL}/lobby/friends/reject`, { method:'POST', headers: authHeaders(token, {'Content-Type':'application/json'}), body: JSON.stringify({ sender_id: senderId }) });
      load();
    } catch {} finally { setProcessingRequest(null); }
  };

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/profile/data`, { headers: authHeaders(token) });
      if (res.status === 401) { logout(); return; }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load profile');
      setData(d);
      if (d.user) updateUser(d.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, logout, updateUser]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleFriendUpdate = () => load();
    window.addEventListener('friend-list-updated', handleFriendUpdate);
    return () => window.removeEventListener('friend-list-updated', handleFriendUpdate);
  }, [load]);

  // Live points polling every 30s
  useEffect(() => {
    if (!token) return;
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load, token]);

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarLoading(true);
    try {
      const fd = new FormData(); fd.append('avatar', file);
      const res = await fetch(`${API_BASE_URL}/profile/avatar`, { method:'POST', headers: authHeaders(token), body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      load();
    } catch(e) { setError(e.message); }
    finally { setAvatarLoading(false); }
  };

  const removeFriend = async (id) => {
    setRemovingId(id);
    try {
      await fetch(`${API_BASE_URL}/lobby/friends/${id}`, { method:'DELETE', headers: authHeaders(token) });
      load();
    } catch {} finally { setRemovingId(null); }
  };

  const handleAddFriend = async () => {
    if (!gamerTagInput.trim() || addingFriend) return;
    setAddingFriend(true); setFriendFeedback({ msg: '', ok: true });
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/friends`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ gamer_tag: gamerTagInput.trim() }),
      });
      const data = await res.json();
      setGamerTagInput('');
      setFriendFeedback({ msg: data.message || '✓ Friend request sent!', ok: true });
      setTimeout(() => setFriendFeedback(prev => prev.msg ? { msg: '', ok: true } : prev), 4000);
      load();
    } catch (err) { setFriendFeedback({ msg: err.message, ok: false }); }
    finally { setAddingFriend(false); }
  };

  const handleInvite = async (friend) => {
    if (inviteSent === friend.id || friend.status !== 'online') return;
    setInviteSent(friend.id);
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/invite`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ friend_id: friend.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to send invite');
      
      setTimeout(() => {
        navigate(`/match-room?mode=friend&room=${data.room.code}`);
      }, 800);
    } catch (err) {
      console.error(err);
      setInviteSent(null);
    }
  };

  const { user, stats, recent_matches=[], friends=[], pending_requests=[] } = data || {};

  return (
    <div style={{ minHeight:'100vh', background:'#060608', fontFamily:font.heading, position:'relative', overflow:'hidden' }}>
      {/* Advanced animated background */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(204,255,0,0.12), transparent), radial-gradient(ellipse 60% 40% at 80% 120%, rgba(168,85,247,0.1), transparent)' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M60 0v60M0 0h60' stroke='rgba(255,255,255,0.025)' stroke-width='.5'/%3E%3C/svg%3E")`, backgroundSize:'60px 60px' }}/>
        {/* Floating orbs */}
        <motion.div animate={{ y:[0,-30,0], opacity:[0.4,0.7,0.4] }} transition={{ duration:8, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', top:'15%', left:'10%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(204,255,0,0.08), transparent 70%)', filter:'blur(40px)' }}/>
        <motion.div animate={{ y:[0,25,0], opacity:[0.3,0.6,0.3] }} transition={{ duration:11, repeat:Infinity, ease:'easeInOut', delay:3 }}
          style={{ position:'absolute', bottom:'10%', right:'8%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)', filter:'blur(40px)' }}/>
        <motion.div animate={{ x:[0,20,0], opacity:[0.2,0.5,0.2] }} transition={{ duration:14, repeat:Infinity, ease:'easeInOut', delay:6 }}
          style={{ position:'absolute', top:'50%', right:'25%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.07), transparent 70%)', filter:'blur(30px)' }}/>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px', position:'relative', zIndex:1 }}>

        {/* Nav */}
        <div style={{ display:'flex', gap:12, marginBottom:22, alignItems:'center' }}>
          <Link to="/" style={{ color:'rgba(255,255,255,0.45)', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', gap:6 }}
            onMouseEnter={e=>e.currentTarget.style.color=LIME} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.45)'}>
            ← Home
          </Link>
          <span style={{ color:'rgba(255,255,255,0.15)' }}>·</span>
          <Link to="/tournaments" style={{ color:'rgba(255,255,255,0.45)', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', gap:5 }}
            onMouseEnter={e=>e.currentTarget.style.color=LIME} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.45)'}>
            🏆 Tournaments
          </Link>
          <div style={{ flex:1 }}/>
          {data && <button onClick={()=>setShowSettings(true)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 16px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:13, fontWeight:600 }}>⚙ Settings</button>}
        </div>

        {loading && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 0', flexDirection:'column', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid rgba(255,255,255,0.08)`, borderTopColor:LIME, animation:'spin 0.8s linear infinite' }}/>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Loading profile…</span>
        </div>}

        {!loading && error && <div style={{ ...glass, borderRadius:14, padding:'16px 20px', color:'#f87171', display:'flex', gap:10, alignItems:'center' }}>
          ⚠ {error} <button onClick={load} style={{ marginLeft:'auto', color:LIME, background:'none', border:`1px solid ${LIME}40`, borderRadius:8, padding:'4px 12px', cursor:'pointer', fontSize:12 }}>Retry</button>
        </div>}

        {!loading && !error && data && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* Hero */}
            <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} style={{ ...glass, borderRadius:22, overflow:'hidden' }}>
              <div style={{ height:3, background:`linear-gradient(90deg,${LIME},${GREEN},${PURPLE})` }}/>
              <div style={{ padding:'28px 30px', display:'flex', gap:24, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ position:'relative' }}>
                  <motion.button onClick={()=>avatarRef.current?.click()} whileHover={{scale:1.05}} title="Change avatar"
                    style={{ width:92, height:92, borderRadius:'50%', border:`2.5px solid ${LIME}60`, background:'rgba(255,255,255,0.06)', cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:700, color:LIME, padding:0 }}>
                    {avatarLoading ? <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid transparent`, borderTopColor:LIME, animation:'spin 0.8s linear infinite' }}/> :
                      user.avatar_url ? <img src={user.avatar_url} alt="av" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : user.name?.charAt(0)?.toUpperCase()}
                  </motion.button>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar} style={{display:'none'}}/>
                  <div style={{ position:'absolute', bottom:4, right:4, width:14, height:14, borderRadius:'50%', border:'2.5px solid #060608', background: user.presence_status==='online' ? GREEN : 'rgba(255,255,255,0.3)' }}/>
                </div>

                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                    <h1 style={{ margin:0, color:'#fff', fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{user.name}</h1>
                    <span style={{ fontSize:11, color: user.presence_status==='online' ? GREEN : 'rgba(255,255,255,0.35)', background: user.presence_status==='online' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${user.presence_status==='online' ? GREEN+'40' : 'rgba(255,255,255,0.1)'}`, borderRadius:100, padding:'2px 10px' }}>● {user.presence_status}</span>
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:14 }}>
                    {user.gamer_tag ? `@${user.gamer_tag} · ` : ''}{user.email}
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {[{ l:'Global Rank', v: user.rank ? `#${user.rank}` : '—', a:LIME },
                      { l:'Total Points', v:(user.points||0).toLocaleString(), a:'#fff' },
                      { l:'Member Since', v: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : '—', a:'rgba(255,255,255,0.7)' }
                    ].map(({ l,v,a }) => (
                      <div key={l} style={{ ...glass, borderRadius:10, padding:'8px 14px' }}>
                        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{l}</div>
                        <div style={{ fontSize:15, fontWeight:700, color:a }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={()=>setShowSettings(true)} style={{ background:`${LIME}15`, border:`1px solid ${LIME}30`, borderRadius:12, padding:'10px 18px', color:LIME, cursor:'pointer', fontSize:13, fontWeight:700, alignSelf:'flex-start' }}>⚙ Edit</button>
              </div>
            </motion.div>

            {/* Stats */}
            {stats && (
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1}} style={{ display:'flex', gap:12 }}>
                <Stat label="Games Played" value={stats.games_played} sub="Snake Championship"/>
                <Stat label="Wins" value={stats.wins} sub="All-time" accent={GREEN}/>
                <Stat label="Win Rate" value={`${stats.win_rate}%`} sub={`${stats.wins}W / ${stats.games_played-stats.wins}L`} accent={stats.win_rate>=50?GREEN:'#f87171'}/>
                <Stat label="Best Score" value={(stats.best_score||0).toLocaleString()} sub="Personal record" accent={LIME}/>
                <Stat label="Total Points" value={(user.points||0).toLocaleString()} sub="Live tracking" accent={PURPLE}/>
              </motion.div>
            )}

            {/* Matches + Friends */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

              {/* Recent Matches */}
              <motion.div initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}} transition={{delay:0.15}} style={{ ...glass, borderRadius:18, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>🐍 Recent Matches</span>
                  <button onClick={load} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:12 }}>↻ Refresh</button>
                </div>
                {recent_matches.length === 0 ? (
                  <div style={{ padding:'40px 20px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>No matches yet — play to earn score!</div>
                ) : recent_matches.map((m, i) => (
                  <div key={m.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'center', padding:'12px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                    <div>
                      <div style={{ color:'#fff', fontSize:14, fontWeight:600 }}>Snake Championship</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{m.played_at ? new Date(m.played_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontWeight:800, fontFamily:font.mono }}>{(m.score||0).toLocaleString()}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>score</div>
                    </div>
                    <div style={{ fontSize:11, fontWeight:700, borderRadius:100, padding:'4px 10px', background: m.won?'rgba(16,185,129,0.15)':'rgba(248,113,113,0.12)', color: m.won?GREEN:'#f87171', border:`1px solid ${m.won?GREEN+'40':'#f8717140'}` }}>
                      {m.won?'WIN':'LOSS'}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Friends */}
              <motion.div initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{delay:0.2}} style={{ ...glass, borderRadius:18, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#fff', fontWeight:700, fontSize:15 }}>👥 Friends <span style={{ fontSize:12, opacity:0.5 }}>{friends.length}</span></span>
                  {friends.filter(f=>f.status==='online').length > 0 && <span style={{ fontSize:12, color:GREEN }}>{friends.filter(f=>f.status==='online').length} online</span>}
                </div>

                {/* Add Friend Input */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        id="add-friend-input"
                        value={gamerTagInput}
                        onChange={e => setGamerTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                        placeholder="Enter gamer tag to search or add…"
                        style={{
                          width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(0,0,0,0.25)', color: '#fff', padding: '9px 12px',
                          fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", outline: 'none',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor = `${LIME}50`}
                        onBlur={e => setTimeout(() => e.target.style.borderColor = 'rgba(255,255,255,0.1)', 200)}
                      />
                      
                      {/* Search Dropdown */}
                      <AnimatePresence>
                        {gamerTagInput.trim().length >= 2 && searchResults.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 10, background: 'rgba(15,15,20,0.98)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                            {searchResults.map(res => (
                              <div key={res.id} onClick={() => { setGamerTagInput(res.gamer_tag); setSearchResults([]); document.getElementById('add-friend-input').focus(); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <Av url={res.avatar_url} name={res.name} size={28}/>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.name}</div>
                                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>@{res.gamer_tag}</div>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button
                      onClick={handleAddFriend}
                      disabled={addingFriend || !gamerTagInput.trim()}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{
                        borderRadius: 10, border: `1px solid ${LIME}45`, color: '#000',
                        background: addingFriend ? 'rgba(204,255,0,0.4)' : LIME,
                        padding: '9px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        opacity: (!gamerTagInput.trim()) ? 0.5 : 1, transition: 'opacity 0.2s',
                      }}>
                      {addingFriend ? '…' : 'Add'}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {friendFeedback.msg && !friendFeedback.ok && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ marginTop: 8, fontSize: 12, color: '#f87171', padding: '0 2px' }}>
                        {friendFeedback.msg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {pending_requests.length > 0 && (
                  <div style={{ padding: '0 20px', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 14, marginBottom: 8 }}>Pending Requests ({pending_requests.length})</div>
                    {pending_requests.map(req => (
                      <div key={req.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderRadius:12, marginBottom:8 }}>
                        <Av url={req.avatar_url} name={req.name} size={32}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ color:'#fff', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{req.name}</div>
                          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>@{req.gamer_tag}</div>
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>handleAcceptRequest(req.id)} disabled={processingRequest===req.id} style={{ borderRadius:8, border:`1px solid ${LIME}40`, background:`${LIME}15`, color:LIME, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>{processingRequest===req.id?'…':'Accept'}</button>
                          <button onClick={()=>handleRejectRequest(req.id)} disabled={processingRequest===req.id} style={{ borderRadius:8, border:`1px solid rgba(255,255,255,0.1)`, background:'transparent', color:'rgba(255,255,255,0.5)', padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer' }}>{processingRequest===req.id?'…':'Ignore'}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {friends.length === 0 ? (
                  <div style={{ padding:'40px 20px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
                    No friends yet. Add them above!
                  </div>
                ) : friends.map((f, i) => (
                  <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ position:'relative' }}>
                      <Av url={f.avatar_url} name={f.name} size={36}/>
                      <div style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderRadius:'50%', border:'2px solid #060608', background: f.status==='online'?GREEN:'rgba(255,255,255,0.25)' }}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:'#fff', fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>@{f.gamer_tag} · {(f.points||0).toLocaleString()} pts</div>
                    </div>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>handleInvite(f)} disabled={f.status !== 'online'} style={{ borderRadius:8, padding:'4px 10px', cursor:f.status === 'online' ? 'pointer' : 'not-allowed', fontSize:11, fontWeight:600, border:`1px solid ${inviteSent===f.id?GREEN+'50':LIME+'35'}`, color:inviteSent===f.id?GREEN:LIME, background:inviteSent===f.id?`${GREEN}12`:`${LIME}10`, opacity: f.status !== 'online' ? 0.3 : 1 }}>
                        {inviteSent===f.id?'✓ Sent':'Invite'}
                      </button>
                      <button onClick={()=>removeFriend(f.id)} disabled={removingId===f.id} title="Remove"
                        style={{ borderRadius:8, padding:'4px 8px', cursor:'pointer', fontSize:12, border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)', background:'transparent' }}
                        onMouseEnter={e=>{e.currentTarget.style.color='#f87171';e.currentTarget.style.borderColor='#f8717140';}} onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.3)';e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';}}>
                        {removingId===f.id?'…':'✕'}
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal token={token} user={user||authUser} onClose={()=>setShowSettings(false)} onUpdated={(u)=>{ updateUser(u); load(); setShowSettings(false); }}/>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {friendFeedback.msg && friendFeedback.ok && (
          <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 30, x: '-50%' }} exit={{ opacity: 0, y: -50, x: '-50%' }}
            style={{ position: 'fixed', top: 0, left: '50%', zIndex: 9999, background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(10px)', border: `1px solid ${GREEN}40`, padding: '12px 24px', borderRadius: 100, color: GREEN, fontWeight: 700, fontSize: 14, boxShadow: '0 10px 40px rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{friendFeedback.msg}</span>
            <button onClick={() => setFriendFeedback({msg:'', ok:true})} style={{ background:'none', border:'none', color:GREEN, opacity:0.6, cursor:'pointer', padding:0, marginLeft:8, fontSize:14 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );
};

export default ProfilePage;
