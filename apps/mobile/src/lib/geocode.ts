import type { Place } from '@wtl/core';

// Address search, same request and parsing as the prototype (app.js geocode, :288).
// The only network call besides map tiles; the query goes to geoportail.lu (Luxembourg's official portal).
export const GEOCODER_URL = 'https://apiv3.geoportail.lu/geocode/search?queryString=';

interface GeoportailResponse {
  results?: { name: string; geomlonlat: { coordinates: [number, number] } }[];
}

/** The geocoder answered but has no result (as opposed to a network or server error). */
export class NotFoundError extends Error {
  constructor() {
    super('not found');
    this.name = 'NotFoundError';
  }
}

/** By name rather than instanceof: subclasses of Error may be transpiled. */
export const isNotFound = (e: unknown): boolean => e instanceof Error && e.name === 'NotFoundError';

export const GEOCODE_TIMEOUT_MS = 10_000;

/** Rejects with NotFoundError when there is no result, or another Error on network failure or timeout. */
export async function geocode(q: string, timeoutMs: number = GEOCODE_TIMEOUT_MS): Promise<Place> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(GEOCODER_URL + encodeURIComponent(q), { signal: ctrl.signal });
    if (!r.ok) throw new Error(`geocoder HTTP ${r.status}`);
    return parseGeocode((await r.json()) as GeoportailResponse);
  } finally {
    clearTimeout(timer);
  }
}

export function parseGeocode(j: GeoportailResponse): Place {
  const first = j.results?.[0];
  if (!first) throw new NotFoundError();
  const [lon, lat] = first.geomlonlat.coordinates;
  return { lat, lon, label: first.name.replace(/\s+,/g, ',').replace(/^[\s,]+/, '') };
}
