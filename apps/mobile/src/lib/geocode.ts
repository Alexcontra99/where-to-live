import type { Place } from '@wtl/core';

// Address search, same request and parsing as the prototype (app.js geocode, :288).
// The only network call besides map tiles; the query goes to geoportail.lu (Luxembourg's official portal).
export const GEOCODER_URL = 'https://apiv3.geoportail.lu/geocode/search?queryString=';

interface GeoportailResponse {
  results?: { name: string; geomlonlat: { coordinates: [number, number] } }[];
}

export async function geocode(q: string, signal?: AbortSignal): Promise<Place> {
  const r = await fetch(GEOCODER_URL + encodeURIComponent(q), { signal });
  if (!r.ok) throw new Error(`geocoder HTTP ${r.status}`);
  return parseGeocode((await r.json()) as GeoportailResponse);
}

export function parseGeocode(j: GeoportailResponse): Place {
  const first = j.results?.[0];
  if (!first) throw new Error('not found');
  const [lon, lat] = first.geomlonlat.coordinates;
  return { lat, lon, label: first.name.replace(/\s+,/g, ',').replace(/^[\s,]+/, '') };
}
