import type BottomSheet from '@gorhom/bottom-sheet';
import { defaultFilters, exampleFilters, type CellInfo, type Filters } from '@wtl/core';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CellSheet } from '../components/CellSheet';
import { Button } from '../components/controls';
import { FilterSheet, SNAP_POINTS, type PickTarget } from '../components/FilterSheet';
import { ResultMap } from '../components/ResultMap';
import { data } from '../lib/engine';
import { pointLabel, toEngineFilters } from '../lib/filters';
import { loadFilters, saveFilters } from '../lib/storage';
import { useTheme } from '../lib/theme';
import { useEvaluation } from '../lib/useEvaluation';

export default function MapScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useRef<BottomSheet>(null);
  const [filters, setFilters] = useState<Filters | null>(null);
  const [picking, setPicking] = useState<PickTarget | null>(null);
  const [cell, setCell] = useState<CellInfo | null>(null);
  const { engine, layer, results, computing, error } = useEvaluation(filters);

  // Last filters from the device, or the prototype's empty start.
  useEffect(() => {
    let live = true;
    void loadFilters().then((f) => live && setFilters(f ?? defaultFilters()));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!filters) return;
    const timer = setTimeout(() => void saveFilters(filters), 1000);
    return () => clearTimeout(timer);
  }, [filters]);

  const onChange = useCallback((f: Filters) => setFilters(f), []);
  const onPick = useCallback((target: PickTarget) => {
    setCell(null);
    setPicking(target);
    sheet.current?.snapToIndex(0);
  }, []);
  const onExample = useCallback(() => setFilters(exampleFilters()), []);
  const onSources = useCallback(() => router.push('/sources'), []);

  const onMapPress = useCallback(
    (lat: number, lon: number) => {
      if (picking) {
        const loc = { lat, lon, label: pointLabel(lat, lon) };
        setFilters((cur) => {
          if (!cur) return cur;
          const f = { ...cur, people: [...cur.people], places: [...cur.places] };
          if (picking.kind === 'person' && f.people[picking.index])
            f.people[picking.index] = { ...f.people[picking.index]!, dest: loc };
          if (picking.kind === 'place' && f.places[picking.index])
            f.places[picking.index] = { ...f.places[picking.index]!, loc };
          return f;
        });
        setPicking(null);
        sheet.current?.snapToIndex(1);
        return;
      }
      if (!engine) return;
      const i = engine.grid.cellAt(lat, lon);
      if (i < 0) return;
      // The card uses the filters of the evaluation on screen, as the prototype popup does.
      setCell(
        results ? engine.cellInfo(i, results.ev) : engine.cellInfo(i, toEngineFilters(filters!)),
      );
      sheet.current?.snapToIndex(0);
    },
    [picking, engine, results, filters],
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ResultMap
        layer={layer}
        fill={results?.fill ?? null}
        filters={filters}
        pois={data.pois ?? []}
        bottomInset={typeof SNAP_POINTS[0] === 'number' ? SNAP_POINTS[0] : 0}
        onPress={onMapPress}
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
      {filters && (
        <FilterSheet
          ref={sheet}
          filters={filters}
          onChange={onChange}
          onPick={onPick}
          summary={results?.summary ?? null}
          computing={computing}
          error={error}
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
