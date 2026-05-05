import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './api';

window.Pusher = Pusher;

let echo = null;
let currentToken = null;

// API_BASE_URL ends with '/api' — broadcasting/auth lives at root, strip /api
const WS_BASE = API_BASE_URL.replace(/\/api$/, '');

/**
 * Custom authorizer — bypasses Pusher-js's built-in auth header handling
 * which is unreliable. Uses a plain fetch() with the JWT token in the
 * Authorization header, exactly like all other API calls.
 */
function makeAuthorizer() {
  return (channel) => ({
    authorize(socketId, callback) {
      fetch(`${WS_BASE}/broadcasting/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'application/json',
          'Authorization': currentToken ? `Bearer ${currentToken}` : '',
        },
        body: JSON.stringify({
          socket_id:    socketId,
          channel_name: channel.name,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Auth ${res.status}`);
          return res.json();
        })
        .then(data => callback(null, data))
        .catch(err => {
          console.warn('[Echo] channel auth failed:', err.message);
          callback(err, null);
        });
    },
  });
}

function buildEcho() {
  return new Echo({
    broadcaster:       'reverb',
    key:               import.meta.env.VITE_REVERB_APP_KEY ?? 'apexnova-key-local',
    wsHost:            import.meta.env.VITE_REVERB_HOST    ?? '127.0.0.1',
    wsPort:            Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort:           Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS:          false,
    enabledTransports: ['ws', 'wss'],
    disableStats:      true,
    // Custom authorizer replaces built-in auth.headers approach
    // so the JWT token is always fresh at the moment of the auth request
    authorizer: makeAuthorizer(),
  });
}

function getEcho() {
  if (!echo) {
    try {
      echo = buildEcho();
    } catch (e) {
      console.warn('[Echo] failed to initialise:', e.message);
      return null;
    }
  }
  return echo;
}

/**
 * Call once after login / on app start.
 * The custom authorizer reads `currentToken` at request time,
 * so just updating this variable is enough — no Echo rebuild needed.
 */
export function setEchoToken(token) {
  currentToken = token;
}

/** Tear down Echo (call on logout) */
export function resetEcho() {
  try { echo?.disconnect(); } catch {}
  echo = null;
  currentToken = null;
}

export default getEcho;
