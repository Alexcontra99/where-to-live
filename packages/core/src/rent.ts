import { DEFAULT_SIZE, L_NAT, SIZE_CURVE } from './constants';

/** €/m² for a flat of S m²: log-linear interpolation of the size curve, flat outside it (app.js fSize). */
export function fSize(S: number): number {
  const first = SIZE_CURVE[0]!;
  const last = SIZE_CURVE[SIZE_CURVE.length - 1]!;
  if (S <= first[0]) return first[1];
  if (S >= last[0]) return last[1];
  for (let j = 1; j < SIZE_CURVE.length; j++) {
    const [s0, v0] = SIZE_CURVE[j - 1]!;
    const [s1, v1] = SIZE_CURVE[j]!;
    if (S <= s1)
      return v0 + ((Math.log(S) - Math.log(s0)) / (Math.log(s1) - Math.log(s0))) * (v1 - v0);
  }
  return NaN; // unreachable for numbers; app.js returns undefined (→ NaN) for NaN input
}

/** Total rent must never fall when size grows: running maximum of s × f(s) (app.js monoTotal). */
export function monoTotal(S: number): number {
  let m = 0;
  for (let s = 15; s <= S; s++) m = Math.max(m, s * fSize(s));
  return Math.max(m, S * fSize(S));
}

/** Estimated asking €/m² for S m² in an area with price level `L` (app.js eurM2). */
export function eurM2(a: { L: number | null }, S: number): number {
  return (monoTotal(S) / S) * 1.04 * Math.sqrt((a.L as number) / L_NAT);
}

/** Estimated monthly asking rent (€) for S m². */
export const estRent = (a: { L: number | null }, S: number): number => S * eurM2(a, S);

/** The size used for rent when the user has not set one (app.js refSize). */
export const refSize = (size: number | null | undefined): number => size || DEFAULT_SIZE;
