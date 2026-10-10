import { describe, expect, it } from 'vitest';
import { GEOCODER_URL, parseGeocode } from '../src/lib/geocode';

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
  it('uses the geoportail.lu endpoint', () => {
    expect(GEOCODER_URL).toBe('https://apiv3.geoportail.lu/geocode/search?queryString=');
  });
});
