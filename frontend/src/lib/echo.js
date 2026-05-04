import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echo = null;

function getEcho() {
  if (!echo) {
    try {
      echo = new Echo({
        broadcaster:       'reverb',
        key:               import.meta.env.VITE_REVERB_APP_KEY  ?? 'apexnova-key-local',
        wsHost:            import.meta.env.VITE_REVERB_HOST     ?? '127.0.0.1',
        wsPort:            Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort:           Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS:          false,
        enabledTransports: ['ws', 'wss'],
        disableStats:      true,
        authEndpoint:      'http://127.0.0.1:8000/broadcasting/auth',
        auth: { headers: {} },
      });
    } catch (e) {
      console.warn('[Echo] failed to initialise:', e.message);
      return null;
    }
  }
  return echo;
}

/** Call once after login so the auth header is always fresh */
export function setEchoToken(token) {
  try {
    const e = getEcho();
    if (!e) return;
    if (e.options?.auth?.headers)
      e.options.auth.headers['Authorization'] = `Bearer ${token}`;
    if (e.connector?.options?.auth?.headers)
      e.connector.options.auth.headers['Authorization'] = `Bearer ${token}`;
  } catch (err) {
    console.warn('[Echo] setEchoToken error:', err.message);
  }
}

export default getEcho;
