// Text formatting shared with the prototype (app.js fmtKm2, fmtM, noiseWord). Words are ours; dB in small print.

/** Area in km² for `cells` cells: "<0.1 km²" or one decimal. */
export const fmtKm2 = (cells: number, cellKm2: number): string => {
  const v = cells * cellKm2;
  return v < 0.1 ? '<0.1 km²' : v.toFixed(1) + ' km²';
};

/** Distance in metres: "6+ km", "1.2 km" or rounded to 10 m. */
export const fmtM = (m: number): string =>
  m >= 6000 ? '6+ km' : m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m';

/** Official Lden map band in words. `cov` = 2 inside the agglomeration map (all sources mapped). */
export const noiseWord = (band: number, cov: number): string =>
  band >= 70
    ? `extremely loud (${band}+ dB)`
    : band === 65
      ? 'very loud (65–69 dB)'
      : band === 60
        ? 'loud (60–64 dB)'
        : band === 55
          ? 'above WHO guideline (55–59 dB)'
          : cov === 2
            ? 'under 55 dB'
            : 'not mapped';
