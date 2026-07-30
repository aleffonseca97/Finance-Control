/** Money rounding helper used across credit-card and budget math. */

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}
