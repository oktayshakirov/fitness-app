/**
 * The first store version ships without purchases, so every Pro feature (widget, unlimited
 * routines) is unlocked. The RevenueCat version lives in commit c6e2505; see docs/PLAN.md.
 */
export function useIsPro() {
  return true;
}
export async function startPro() {}
export async function showPaywall() {}
