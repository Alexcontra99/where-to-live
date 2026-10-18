// Rent wording for the results list. Pure TypeScript (tested in test/rent.test.ts).
import type { AreaMatch } from '@wtl/core';

/**
 * Rent of a top area, worded as the cell card: areas without a published rent (national model) show no figure,
 * and districts priced from the city's published average say so.
 */
export function rentText(a: Pick<AreaMatch, 'estRent' | 'rentProvenance'>, size: number): string {
  switch (a.rentProvenance.basis) {
    case 'national-model':
      return 'no rent data';
    case 'city-average':
      return `about €${a.estRent} for ${size} m² (city average)`;
    default:
      return `about €${a.estRent} for ${size} m²`;
  }
}
