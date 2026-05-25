import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkAccess, activatePass, getEntitlements } from '../lib/subscription';

/**
 * useSubscription
 *
 * Provides:
 *  - entitlements   — full snapshot (tier, trialUsed, dailyCount, etc.)
 *  - loadingEntitlements — boolean
 *  - checkAndGate(game, mode) → { allowed, reason, message }
 *  - activatePlayPass()     → { success, message, perks, expires_at } | { error }
 *  - refreshEntitlements()  — force-refetch
 */
export function useSubscription() {
  const { token } = useAuth();

  const [entitlements, setEntitlements] = useState(null);
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);

  const refreshEntitlements = useCallback(async () => {
    if (!token) return;
    setLoadingEntitlements(true);
    try {
      const data = await getEntitlements(token);
      setEntitlements(data);
    } catch (e) {
      console.error('[useSubscription] Failed to fetch entitlements:', e);
    } finally {
      setLoadingEntitlements(false);
    }
  }, [token]);

  // Load on mount once token is available
  useEffect(() => {
    if (token) refreshEntitlements();
  }, [token, refreshEntitlements]);

  /**
   * Call before navigating into any game session.
   * Returns { allowed, reason, message }.
   */
  const checkAndGate = useCallback(
    async (game, mode) => {
      if (!token) return { allowed: false, reason: 'unauthenticated', message: 'Please log in.' };
      try {
        const result = await checkAccess(token, game, mode);
        // If allowed, refresh entitlements so daily count is up-to-date in UI
        if (result.allowed) refreshEntitlements();
        return result;
      } catch (e) {
        console.error('[useSubscription] checkAndGate error:', e);
        // Network error → fail open (allow play) to not block legit users
        return { allowed: true, reason: null, message: null };
      }
    },
    [token, refreshEntitlements]
  );

  /**
   * Activate Play Pass (demo/mock flow — no payment).
   * Returns the full API response.
   */
  const activatePlayPass = useCallback(async () => {
    if (!token) return { error: 'Not authenticated' };
    try {
      const result = await activatePass(token);
      if (result.success) {
        // Refresh entitlements so tier flips to premium immediately
        await refreshEntitlements();
      }
      return result;
    } catch (e) {
      console.error('[useSubscription] activatePlayPass error:', e);
      return { error: 'Failed to activate. Please try again.' };
    }
  }, [token, refreshEntitlements]);

  return {
    entitlements,
    loadingEntitlements,
    checkAndGate,
    activatePlayPass,
    refreshEntitlements,
  };
}
