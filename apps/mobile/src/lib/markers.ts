// Map markers (app.js drawMarkers). Pure TypeScript (no React Native imports) so it runs under vitest.
import { CATS, type Filters } from '@wtl/core';
import { pointLabel } from './filters';

/**
 * Work points and my places as a GeoJSON string, with the prototype's tooltip text in `tip`
 * ("Person 1: <address>", "<place name>"). A string, so React can tell by value whether it changed.
 */
export function markersGeoJSON(f: Pick<Filters, 'people' | 'places'>): string {
  const features: GeoJSON.Feature<GeoJSON.Point, { kind: 'person' | 'place'; tip: string }>[] = [];
  f.people.forEach((p, n) => {
    if (p.dest)
      features.push({
        type: 'Feature',
        properties: {
          kind: 'person',
          tip: `${p.label || `Person ${n + 1}`}: ${p.dest.label ?? pointLabel(p.dest.lat, p.dest.lon)}`,
        },
        geometry: { type: 'Point', coordinates: [p.dest.lon, p.dest.lat] },
      });
  });
  f.places.forEach((p) => {
    if (p.loc)
      features.push({
        type: 'Feature',
        properties: { kind: 'place', tip: p.name.trim() || 'My place' },
        geometry: { type: 'Point', coordinates: [p.loc.lon, p.loc.lat] },
      });
  });
  return JSON.stringify({ type: 'FeatureCollection', features });
}

/** Categories with an active filter, comma-separated ('' when none): their POIs are drawn. */
export const activeCatsKey = (f: Pick<Filters, 'cats'>): string =>
  CATS.filter(([k]) => f.cats[k].mode !== 'any')
    .map(([k]) => k)
    .join(',');
