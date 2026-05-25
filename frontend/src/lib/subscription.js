import { API_BASE_URL, authHeaders } from './api';

/**
 * Check whether the current user is allowed to start a game session.
 * @returns {{ allowed: boolean, reason: string|null, message: string|null }}
 */
export async function checkAccess(token, game, mode) {
  const res = await fetch(`${API_BASE_URL}/subscription/check`, {
    method: 'POST',
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ game, mode }),
  });
  return res.json();
}

/**
 * Activate the monthly Play Pass for the authenticated user.
 * @returns {{ success: boolean, message: string, perks: string[], expires_at: string }}
 */
export async function activatePass(token) {
  const res = await fetch(`${API_BASE_URL}/subscription/activate`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.json();
}

/**
 * Fetch full entitlements snapshot for the authenticated user.
 */
export async function getEntitlements(token) {
  const res = await fetch(`${API_BASE_URL}/subscription/entitlements`, {
    headers: authHeaders(token),
  });
  return res.json();
}
