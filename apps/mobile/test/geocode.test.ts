import { describe, expect, it } from 'vitest';
import { GEOCODER_URL, isNotFound, parseGeocode } from '../src/lib/geocode';

describe('geocoder (app.js geocode)', () => {
  it('reads the first result and tidies the label', () => {
    expect(
      parseGeocode({
        results: [
          {
            name: ' , 2 Rue du Fort Wallis ,Luxembourg',
            geomlonlat: { coordinates: [6.12, 49.6] },
          },
          { name: 'other', geomlonlat: { coordinates: [0, 0] } },
        ],
      }),
    ).toEqual({ lat: 49.6, lon: 6.12, label: '2 Rue du Fort Wallis,Luxembourg' });
  });
  it('throws when nothing is found', () => {
    expect(() => parseGeocode({ results: [] })).toThrow('not found');
    expect(() => parseGeocode({})).toThrow('not found');
  });
  it('treats a result without coordinates as not found', () => {
    for (const r of [
      { name: 'x' },
      { name: 'x', geomlonlat: {} },
      { geomlonlat: { coordinates: [NaN, 1] } },
    ])
      expect(isNotFound(catchErr(() => parseGeocode({ results: [r as never] })))).toBe(true);
  });
  it('tells "not found" apart from network errors', () => {
    let err: unknown;
    try {
      parseGeocode({ results: [] });
    } catch (e) {
      err = e;
    }
    expect(isNotFound(err)).toBe(true);
    expect(isNotFound(new TypeError('Network request failed'))).toBe(false);
    expect(isNotFound(new Error('geocoder HTTP 500'))).toBe(false);
  });
  it('uses the geoportail.lu endpoint', () => {
    expect(GEOCODER_URL).toBe('https://apiv3.geoportail.lu/geocode/search?queryString=');
  });
});

function catchErr(fn: () => unknown): unknown {
  try {
    fn();
  } catch (e) {
    return e;
  }
  return undefined;
}
