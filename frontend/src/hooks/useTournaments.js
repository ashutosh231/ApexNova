import { useEffect, useState } from 'react';
import { ALL_TOURNAMENTS } from '../data/allTournaments.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apexnovaa.me/api';

function normalizeStatic(t) {
  const [curStr, maxStr] = t.players.split('/');
  const players_current = parseInt(curStr.replace(/,/g, ''), 10);
  const players_max = parseInt(maxStr.trim().replace(/,/g, ''), 10);
  return {
    id: t.id,
    emoji: t.emoji,
    name: t.name,
    game: t.game,
    category: t.category,
    difficulty: t.difficulty,
    players: t.players,
    players_current,
    players_max,
    fill_percent: players_max ? Math.min(100, Math.round((players_current / players_max) * 100)) : 0,
    prize: t.prize,
    tag_label: t.tagLabel,
    tagLabel: t.tagLabel,
    is_live: t.isLive,
    isLive: t.isLive,
    time_left: t.timeLeft,
    timeLeft: t.timeLeft,
    cover_image: t.coverImage,
    coverImage: t.coverImage,
    accent: null,
    secondary: null,
  };
}

const FALLBACK = ALL_TOURNAMENTS.map(normalizeStatic);

export function useTournaments() {
  const [tournaments, setTournaments] = useState(FALLBACK);
  const [meta, setMeta] = useState({ count: FALLBACK.length, live_count: 0, total_prize: 0, season: 'Season 03' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/tournaments`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const list = (data.tournaments ?? []).map((t) => ({
          ...t,
          tagLabel: t.tag_label ?? t.tagLabel,
          isLive: t.is_live ?? t.isLive,
          timeLeft: t.time_left ?? t.timeLeft,
          coverImage: t.cover_image ?? t.coverImage,
        }));

        if (list.length) {
          setTournaments(list);
          setMeta(data.meta ?? {});
        }
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setTournaments(FALLBACK);
          setMeta({
            count: FALLBACK.length,
            live_count: FALLBACK.filter((t) => t.isLive).length,
            total_prize: FALLBACK.reduce((s, t) => s + parseInt(t.prize.replace(/[^0-9]/g, ''), 10), 0),
            season: 'Season 03',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { tournaments, meta, loading, error };
}
