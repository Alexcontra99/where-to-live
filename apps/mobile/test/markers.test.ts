import { defaultFilters, exampleFilters } from '@wtl/core';
import { describe, expect, it } from 'vitest';
import { activeCatsKey, markersGeoJSON } from '../src/lib/markers';

describe('map markers (app.js drawMarkers)', () => {
  it('work points and places with the prototype tooltip text', () => {
    const f = exampleFilters();
    f.places.push(
      { name: '  ', loc: { lat: 49.6, lon: 6.1 }, mode: 'near', m: 500 },
      { name: 'No location', loc: null, mode: 'near', m: 500 },
    );
    f.people[1]!.dest = { lat: 49.61, lon: 6.12 };
    const fc = JSON.parse(markersGeoJSON(f)) as GeoJSON.FeatureCollection<GeoJSON.Point>;
    expect(fc.features.map((x) => x.properties)).toEqual([
      { kind: 'person', tip: 'Person 1: Kirchberg (tram stop Universitéit)' },
      { kind: 'person', tip: 'Person 2: Point 49.6100, 6.1200' },
      { kind: 'place', tip: 'My place' },
    ]);
    expect(fc.features[0]!.geometry.coordinates).toEqual([6.161, 49.6261]);
  });
  it('same filters give the same string', () => {
    expect(markersGeoJSON(exampleFilters())).toBe(markersGeoJSON(exampleFilters()));
  });
  it('active categories', () => {
    expect(activeCatsKey(defaultFilters())).toBe('');
    expect(activeCatsKey(exampleFilters()).split(',').sort()).toEqual(['park', 'supermarket']);
  });
});
