import { router } from 'expo-router';

/*
 * Premium, for when payments are switched on (RevenueCat in the store build). Until then everyone has
 * everything: nothing is locked, and the paywall can only be looked at, never charged.
 *
 * Free once billing is live: the daily affirmation, a few ready-made tracks, one goal, the Calm and Deep
 * voices. Premium: every voice, your own voice, unlimited goals, frequencies and every track.
 */
export const BILLING_LIVE = false;

export const PRICES = {
  annual: { price: '$39.99', per: 'year', perWeek: '$0.77', trialDays: 7 },
  monthly: { price: '$9.99', per: 'month' },
};

export function isPremium() {
  return !BILLING_LIVE;
}

/** True if the feature is open; otherwise shows the paywall and returns false. */
export function requirePremium() {
  if (isPremium()) return true;
  router.push('/paywall');
  return false;
}
