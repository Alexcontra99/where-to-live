import { rentProvenance } from '@wtl/core';
import { describe, expect, it } from 'vitest';
import { rentText } from '../src/lib/rent';
import { exampleEvaluation, getTestEngine } from './engine';

describe('rent in the results list', () => {
  it('shows a figure only for published rents, and marks the city average', () => {
    expect(
      rentText({ estRent: 1800, rentProvenance: { basis: 'published', source: 'x' } }, 60),
    ).toBe('about €1800 for 60 m²');
    expect(
      rentText({ estRent: 1800, rentProvenance: { basis: 'city-average', source: 'x' } }, 60),
    ).toBe('about €1800 for 60 m² (city average)');
    expect(
      rentText({ estRent: 1800, rentProvenance: { basis: 'national-model', source: null } }, 60),
    ).toBe('no rent data');
  });
  it('agrees with the cell card: no figure exactly where the card says "No rent data"', () => {
    const areas = getTestEngine().data.areas;
    for (const a of areas) expect(rentProvenance(a).basis === 'national-model').toBe(!a.eur_m2);
    for (const a of getTestEngine().summary(exampleEvaluation()).topAreas)
      expect(a.rentProvenance).toEqual(rentProvenance(areas[a.area]!));
  });
});
