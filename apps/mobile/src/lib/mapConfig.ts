import type { LngLatBounds, StyleSpecification } from '@maplibre/maplibre-react-native';

// Base map: the same geoportail.lu WMTS layer and attribution as the prototype (prototipo/app.js :144-146).
export const TILE_URL =
  'https://wmts1.geoportail.lu/opendata/wmts/topomap_gray/GLOBAL_WEBMERCATOR/{z}/{x}/{y}.png';
export const ATTRIBUTION = 'Base map © ACT Luxembourg (CC0) · places © OpenStreetMap contributors';

export const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: [TILE_URL],
      tileSize: 256,
      maxzoom: 19,
      attribution: ATTRIBUTION,
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#f2f2f2' } },
    { id: 'base', type: 'raster', source: 'base' },
  ],
};

/** The prototype's start view: the city (app.js fitBounds [[49.585, 6.085], [49.645, 6.195]]). */
export const START_BOUNDS: LngLatBounds = [6.085, 49.585, 6.195, 49.645];
