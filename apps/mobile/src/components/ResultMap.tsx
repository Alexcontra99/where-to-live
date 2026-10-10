import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type FillLayerSpecification,
  type FilterSpecification,
} from '@maplibre/maplibre-react-native';
import { CATS, type Filters } from '@wtl/core';
import type { Poi } from '@wtl/data-lux';
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { BASE_STYLE, START_BOUNDS } from '../lib/mapConfig';
import { fillColour, type CellFill, type CellLayer } from '../lib/mapFill';
import { useTheme } from '../lib/theme';

type FillColour = NonNullable<FillLayerSpecification['paint']>['fill-color'];

const CAT_NAME: Record<string, string> = Object.fromEntries(CATS);

function poiCollection(pois: Poi[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: pois.map(([lat, lon, cat, name]) => ({
      type: 'Feature',
      properties: { c: cat, name: name ?? CAT_NAME[cat] ?? cat },
      geometry: { type: 'Point', coordinates: [lon, lat] },
    })),
  };
}

/**
 * The result grid. Memoised on its own so that typing in a filter does not re-send the ~10k-entry colour
 * expression: it only changes when a new evaluation arrives.
 */
const Cells = memo(function Cells({ layer, fill }: { layer: CellLayer; fill: CellFill }) {
  const paint = useMemo(
    () => ({ 'fill-color': fillColour(fill) as FillColour, 'fill-antialias': false }),
    [fill],
  );
  // Serialised once: GeoJSONSource stringifies object data on every render.
  const data = useMemo(() => JSON.stringify(layer.geojson), [layer]);
  return (
    <GeoJSONSource id="cells" data={data}>
      <Layer id="cells-fill" type="fill" source="cells" paint={paint} />
    </GeoJSONSource>
  );
});

interface Props {
  layer: CellLayer | null;
  fill: CellFill | null;
  filters: Filters | null;
  pois: Poi[];
  /** Bottom padding so the start view is not hidden behind the sheet. */
  bottomInset: number;
  onPress: (lat: number, lon: number) => void;
}

export const ResultMap = memo(function ResultMap({
  layer,
  fill,
  filters,
  pois,
  bottomInset,
  onPress,
}: Props) {
  const t = useTheme();

  // Work points and my places (app.js drawMarkers).
  const markers = useMemo((): GeoJSON.FeatureCollection<GeoJSON.Point> => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    filters?.people.forEach((p) => {
      if (p.dest)
        features.push({
          type: 'Feature',
          properties: { kind: 'person' },
          geometry: { type: 'Point', coordinates: [p.dest.lon, p.dest.lat] },
        });
    });
    filters?.places.forEach((p) => {
      if (p.loc)
        features.push({
          type: 'Feature',
          properties: { kind: 'place' },
          geometry: { type: 'Point', coordinates: [p.loc.lon, p.loc.lat] },
        });
    });
    return { type: 'FeatureCollection', features };
  }, [filters?.people, filters?.places]);

  const poiData = useMemo(() => JSON.stringify(poiCollection(pois)), [pois]);
  const activeCats = useMemo(
    () => (filters ? CATS.filter(([k]) => filters.cats[k].mode !== 'any').map(([k]) => k) : []),
    [filters],
  );
  const activeKey = activeCats.join(',');
  const poiFilter = useMemo(
    (): FilterSpecification => ['in', ['get', 'c'], ['literal', activeKey.split(',')]],
    [activeKey],
  );

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={BASE_STYLE}
      logo={false}
      attribution
      attributionPosition={{ top: 8, left: 8 }}
      compass={false}
      touchPitch={false}
      onPress={(e) => {
        const [lon, lat] = e.nativeEvent.lngLat;
        onPress(lat, lon);
      }}
    >
      <Camera
        initialViewState={{
          bounds: START_BOUNDS,
          padding: { top: 40, bottom: bottomInset, left: 0, right: 0 },
        }}
        minZoom={9}
        maxZoom={18}
      />
      {layer && fill && <Cells layer={layer} fill={fill} />}
      <GeoJSONSource id="pois" data={poiData}>
        <Layer
          id="pois-dot"
          type="circle"
          source="pois"
          filter={poiFilter}
          layout={{ visibility: activeCats.length ? 'visible' : 'none' }}
          paint={{
            'circle-radius': 3,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#57606a',
            'circle-stroke-width': 1,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="markers" data={markers}>
        <Layer
          id="markers-dot"
          type="circle"
          source="markers"
          paint={{
            'circle-radius': ['match', ['get', 'kind'], 'person', 8, 7],
            'circle-color': ['match', ['get', 'kind'], 'person', t.person, t.place],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
});
