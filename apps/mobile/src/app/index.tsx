import type BottomSheet from '@gorhom/bottom-sheet';
import { defaultFilters, type CellInfo } from '@wtl/core';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CellSheet } from '../components/CellSheet';
import { Button } from '../components/controls';
import { FilterSheet, MIN_SNAP, type Edit, type PickTarget } from '../components/FilterSheet';
import { ResultMap } from '../components/ResultMap';
import { data } from '../lib/engine';
import { applyExample, cloneUi, pointLabel, withIds, type UiFilters } from '../lib/filters';
import { activeCatsKey, markersGeoJSON } from '../lib/markers';
import { loadFilters, saveFilters } from '../lib/storage';
import { useTheme } from '../lib/theme';
import { useEvaluation } from '../lib/useEvaluation';

const TIP_MS = 4000;

export default function MapScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheet>(null);
  const [filters, setFilters] = useState<UiFilters | null>(null);
  const [picking, setPicking] = useState<PickTarget | null>(null);
  const [cell, setCell] = useState<CellInfo | null>(null);
  /** Text of a tapped marker or POI (the prototype's tooltip). */
  const [tip, setTip] = useState<string | null>(null);
  const { engine, layer, results, computing, error } = useEvaluation(filters);

  // Last filters from the device, or the prototype's empty start.
  useEffect(() => {
    let live = true;
    void loadFilters().then((f) => live && setFilters(withIds(f ?? defaultFilters())));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!filters) return;
    const timer = setTimeout(() => void saveFilters(filters), 1000);
    return () => clearTimeout(timer);
  }, [filters]);
  useEffect(() => {
    if (!tip) return;
    const timer = setTimeout(() => setTip(null), TIP_MS);
    return () => clearTimeout(timer);
  }, [tip]);

  // Every edit is applied to the latest state, so a slow address search cannot undo later changes.
  const onEdit = useCallback<Edit>(
    (fn) =>
      setFilters((cur) => {
        if (!cur) return cur;
        const f = cloneUi(cur);
        fn(f);
        return f;
      }),
    [],
  );
  const onPick = useCallback((target: PickTarget) => {
    setCell(null);
    setTip(null);
    setPicking(target);
    sheet.current?.snapToIndex(0);
  }, []);
  const onExample = useCallback(
    () => setFilters((cur) => withIds(applyExample(cur ?? defaultFilters()))),
    [],
  );
  const onSources = useCallback(() => router.push('/sources'), []);

  const onMapPress = useCallback(
    (lat: number, lon: number) => {
      setTip(null);
      if (picking) {
        const loc = { lat, lon, label: pointLabel(lat, lon) };
        onEdit((f) => {
          if (picking.kind === 'person') {
            const p = f.people.find((x) => x.id === picking.id);
            if (p) p.dest = loc;
          } else {
            const p = f.places.find((x) => x.id === picking.id);
            if (p) p.loc = loc;
          }
        });
        setPicking(null);
        sheet.current?.snapToIndex(1);
        return;
      }
      // Before the first evaluation the card would have to compute commutes on the JS thread: wait for it.
      if (!engine || !results) return;
      const i = engine.grid.cellAt(lat, lon);
      if (i < 0) return;
      // The card uses the filters of the evaluation on screen, as the prototype popup does.
      setCell(engine.cellInfo(i, results.ev));
      sheet.current?.snapToIndex(0);
    },
    [picking, engine, results, onEdit],
  );
  const onFeaturePress = useCallback(
    (text: string) => {
      if (picking) return false;
      setTip(text);
      return true;
    },
    [picking],
  );

  const markers = useMemo(() => markersGeoJSON(filters ?? { people: [], places: [] }), [filters]);
  const activeCats = useMemo(() => (filters ? activeCatsKey(filters) : ''), [filters]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ResultMap
        layer={layer}
        fill={results?.fill ?? null}
        markers={markers}
        activeCats={activeCats}
        pois={data.pois ?? []}
        bottomInset={MIN_SNAP}
        onPress={onMapPress}
        onFeaturePress={onFeaturePress}
      />
      {picking && (
        <View
          style={[
            styles.banner,
            { top: insets.top + 8, backgroundColor: t.bg, borderColor: t.border },
          ]}
        >
          <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>
            Tap the map to set the location
          </Text>
          <Button title="Cancel" onPress={() => setPicking(null)} />
        </View>
      )}
      {tip && !picking && (
        <Pressable
          onPress={() => setTip(null)}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
          style={[
            styles.banner,
            { top: insets.top + 52, backgroundColor: t.bg, borderColor: t.border },
          ]}
        >
          <Text style={{ color: t.text, fontSize: 15, flex: 1 }}>{tip}</Text>
        </Pressable>
      )}
      {filters && (
        <FilterSheet
          ref={sheet}
          filters={filters}
          evaluated={results?.ev.filters ?? null}
          onEdit={onEdit}
          onPick={onPick}
          summary={results?.summary ?? null}
          computing={computing}
          failed={error !== null}
          onExample={onExample}
          onSources={onSources}
        />
      )}
      {cell && !picking && <CellSheet info={cell} onClose={() => setCell(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
