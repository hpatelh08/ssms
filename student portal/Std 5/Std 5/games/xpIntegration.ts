/**
 * ⭐ XP Integration
 * ==================
 * Centralized XP sync utility.
 * Call syncXP ONCE when state.status === "complete".
 * Use a ref in the container to prevent duplicate calls.
 */

import { logAction } from '../utils/auditLog';

export const XP_PER_CORRECT_ANSWER = 20;

/**
 * Sync earned XP to the app's global state.
 * @param gameId - Identifier of the completed game
 * @param xpAmount - Total XP earned during the game
 * @param onXPGain - Callback to App's addXP function
 */
export function syncXP(
  gameId: string,
  xpAmount: number,
  onXPGain: (xp: number) => void
): void {
  if (xpAmount <= 0) return;
  onXPGain(xpAmount);
  logAction('xp_synced', 'game', { gameId, amount: xpAmount });
}
