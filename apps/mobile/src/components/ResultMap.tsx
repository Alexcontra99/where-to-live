import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type FillLayerSpecification,
  type FilterSpecification,
  type PressEvent,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { CATS, type CatKey } from '@wtl/core';
import type { Poi } from '@wtl/data-lux';
import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BASE_STYLE, START_BOUNDS } from '../lib/mapConfig';
import { fillColour, type CellFill, type CellLayer } from '../lib/mapFill';

type FillColour = NonNullable<FillLayerSpecification['paint']>['fill-color'];

const CAT_NAME: Record<string, string> = Object.fromEntries(CATS);

// Marker colours of the prototype (app.js drawMarkers), the same in light and dark mode.
export const PERSON_COLOUR = '#0969da';
export const PLACE_COLOUR = '#8250df';

/** Tooltip text per POI, as app.js: "<name or category key> · <category>". */
function poiCollection(pois: Poi[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: pois.map(([lat, lon, cat, name]) => ({
      type: 'Feature',
      properties: { c: cat, tip: `${name || cat} · ${CAT_NAME[cat] ?? cat}` },
      geometry: { type: 'Point', coordinates: [lon, lat] },
    })),
  };
}

/**
 * The result grid. Memoised on its own so that typing in a filter does not re-send the ~10k-entry colour
 * expression: it only changes when a new evaluation arrives. It is drawn below the POI and marker layers
 * (beforeId), whatever the order in which the layers are mounted.
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
      <Layer id="cells-fill" type="fill" source="cells" beforeId="pois-dot" paint={paint} />
    </GeoJSONSource>
  );
});

interface Props {
  layer: CellLayer | null;
  fill: CellFill | null;
  /** Work points and my places as a GeoJSON string (features with `kind` and `tip`); a string so that the
   *  map only re-renders when they change. */
  markers: string;
  /** Categories with an active filter, comma-separated: their POIs are shown. */
  activeCats: string;
  pois: Poi[];
  /** Bottom padding so the start view is not hidden behind the sheet. */
  bottomInset: number;
  onPress: (lat: number, lon: number) => void;
  /** A marker or POI was tapped; return true if handled (then the map press is not fired). */
  onFeaturePress: (tip: string) => boolean;
}

export const ResultMap = memo(function ResultMap({
  layer,
  fill,
  markers,
  activeCats,
  pois,
  bottomInset,
  onPress,
  onFeaturePress,
}: Props) {
  const insets = useSafeAreaInsets();
  const poiData = useMemo(() => JSON.stringify(poiCollection(pois)), [pois]);
  const poiFilter = useMemo(
    (): FilterSpecification => ['in', ['get', 'c'], ['literal', activeCats.split(',') as CatKey[]]],
    [activeCats],
  );
  const onMapPress = useCallback(
    (e: NativeSyntheticEvent<PressEvent>) => {
      const [lon, lat] = e.nativeEvent.lngLat;
      onPress(lat, lon);
    },
    [onPress],
  );
  const onSourcePress = useCallback(
    (e: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const tip = e.nativeEvent.features.find((f) => typeof f.properties?.tip === 'string')
        ?.properties?.tip as string | undefined;
      if (tip && onFeaturePress(tip)) e.stopPropagation();
    },
    [onFeaturePress],
  );

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={BASE_STYLE}
      logo={false}
      attribution
      // Below the status bar / Dynamic Island so the attribution button stays visible and tappable.
      attributionPosition={{ top: insets.top + 8, left: 8 }}
      compass={false}
      touchPitch={false}
      onPress={onMapPress}
    >
      <Camera
        initialViewState={{
          bounds: START_BOUNDS,
          padding: { top: insets.top + 40, bottom: bottomInset, left: 0, right: 0 },
        }}
        minZoom={9}
        maxZoom={19}
      />
      {layer && fill && <Cells layer={layer} fill={fill} />}
      <GeoJSONSource id="pois" data={poiData} onPress={onSourcePress}>
        <Layer
          id="pois-dot"
          type="circle"
          source="pois"
          filter={poiFilter}
          layout={{ visibility: activeCats ? 'visible' : 'none' }}
          paint={{
            'circle-radius': 3,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#57606a',
            'circle-stroke-width': 1,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="markers" data={markers} onPress={onSourcePress}>
        <Layer
          id="markers-dot"
          type="circle"
          source="markers"
          paint={{
            'circle-radius': ['match', ['get', 'kind'], 'person', 8, 7],
            'circle-color': ['match', ['get', 'kind'], 'person', PERSON_COLOUR, PLACE_COLOUR],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          }}
        />
      </GeoJSONSource>
    </Map>
  );
});
