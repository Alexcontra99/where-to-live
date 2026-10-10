import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  ARRIVE_OPTS,
  CATS,
  MAX_PEOPLE,
  MAX_PLACES,
  MODES,
  NOISE,
  NOISE_OPTS,
  cloneFilters,
  type CatMode,
  type Filters,
  type Summary,
} from '@wtl/core';
import { forwardRef, memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  newPerson,
  newPlace,
  parseMax,
  parseMetres,
  parseOptional,
  setCatMode,
} from '../lib/filters';
import { useTheme } from '../lib/theme';
import { Button, Chips, Field, Hint, Label, NumberField, Section, styles } from './controls';
import { LocationEditor } from './LocationEditor';
import { Legend, Results } from './Results';

export type PickTarget = { kind: 'person' | 'place'; index: number };

const ARRIVE_CHIPS = ARRIVE_OPTS.map(
  (h) => [h, `${Math.floor(h)}:${h % 1 ? '30' : '00'}`] as const,
);
const CAT_CHIPS: readonly (readonly [CatMode, string])[] = [
  ['any', "Don't mind"],
  ['near', 'Within'],
  ['far', 'At least'],
];
const PLACE_CHIPS = [
  ['near', 'Within'],
  ['far', 'At least'],
] as const;

export const SNAP_POINTS = [128, '50%', '92%'];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onPick: (target: PickTarget) => void;
  summary: Summary | null;
  computing: boolean;
  error: string | null;
  onExample: () => void;
  onSources: () => void;
}

export const FilterSheet = memo(
  forwardRef<BottomSheet, Props>(function FilterSheet(
    { filters, onChange, onPick, summary, computing, error, onExample, onSources },
    ref,
  ) {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const edit = (fn: (f: Filters) => void) => {
      const f = cloneFilters(filters);
      fn(f);
      onChange(f);
    };

    const status = error
      ? `Error: ${error}`
      : computing || !summary
        ? 'Calculating…'
        : `${summary.fitKm2Label} fit` +
          (summary.topBlocker ? ` · most blocked by ${summary.topBlocker.short}` : '');

    return (
      <BottomSheet
        ref={ref}
        index={1}
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: t.bg }}
        handleIndicatorStyle={{ backgroundColor: t.border }}
      >
        <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '700' }}>Where to live</Text>
            <Pressable onPress={onSources} accessibilityRole="link" hitSlop={8}>
              <Text style={{ color: t.primary, fontSize: 15 }}>Sources</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            {computing && <ActivityIndicator size="small" />}
            <Text
              style={{ color: error ? t.fail : t.muted, fontSize: 14, flexShrink: 1 }}
              numberOfLines={1}
              accessibilityLiveRegion="polite"
            >
              {status}
            </Text>
          </View>
        </View>
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Button title="Load an example" onPress={onExample} />

          <Section title="Commute">
            {filters.people.map((p, n) => (
              <View key={n} style={[styles.card, { backgroundColor: t.surface }]}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Label>{p.label ?? `Person ${n + 1}`}</Label>
                  {n > 0 && (
                    <Pressable
                      onPress={() => edit((f) => void f.people.splice(n, 1))}
                      accessibilityLabel="Remove"
                      hitSlop={10}
                    >
                      <Text style={{ color: t.muted, fontSize: 17 }}>✕</Text>
                    </Pressable>
                  )}
                </View>
                <LocationEditor
                  value={p.dest}
                  placeholder="Work or study address"
                  onChange={(loc) => edit((f) => void (f.people[n]!.dest = loc))}
                  onPick={() => onPick({ kind: 'person', index: n })}
                />
                <Chips
                  label="Mode"
                  options={MODES}
                  value={p.mode}
                  onChange={(m) => edit((f) => void (f.people[n]!.mode = m))}
                />
                <View style={styles.row}>
                  <Label>max</Label>
                  <NumberField
                    value={p.max}
                    parse={parseMax}
                    onChange={(v) => edit((f) => void (f.people[n]!.max = v ?? 30))}
                    accessibilityLabel="Max minutes"
                    width={64}
                  />
                  <Label>min</Label>
                </View>
              </View>
            ))}
            {filters.people.length < MAX_PEOPLE && (
              <Button
                title="+ Add a second person"
                onPress={() => edit((f) => void f.people.push(newPerson(f.people.length)))}
              />
            )}
            <Label>Arrive around</Label>
            <Chips
              label="Arrive around"
              options={ARRIVE_CHIPS}
              value={filters.arrive}
              onChange={(a) => edit((f) => void (f.arrive = a))}
            />
          </Section>

          <Section title="Rent">
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Label>Flat size (m²)</Label>
              <NumberField
                value={filters.size}
                parse={parseOptional}
                onChange={(v) => edit((f) => void (f.size = v))}
                placeholder="e.g. 60"
                accessibilityLabel="Flat size in square metres"
              />
            </View>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Label>Budget per month (€, optional)</Label>
              <NumberField
                value={filters.budget}
                parse={parseOptional}
                onChange={(v) => edit((f) => void (f.budget = v))}
                placeholder="e.g. 2000"
                accessibilityLabel="Budget per month in euros"
                width={92}
              />
            </View>
          </Section>

          <Section title="Noise">
            {NOISE.map(([k, l]) => (
              <View key={k} style={{ gap: 6 }}>
                <Label>{l}</Label>
                <Chips
                  label={l}
                  options={NOISE_OPTS}
                  value={filters.noise[k]}
                  onChange={(v) => edit((f) => void (f.noise[k] = v))}
                />
              </View>
            ))}
          </Section>

          <Section title="Near or far from">
            {CATS.map(([k, l]) => {
              const c = filters.cats[k];
              return (
                <View key={k} style={{ gap: 6 }}>
                  <Label>{l}</Label>
                  <View style={[styles.row, { flexWrap: 'wrap' }]}>
                    <Chips
                      label={l}
                      options={CAT_CHIPS}
                      value={c.mode}
                      onChange={(m) => edit((f) => void (f.cats[k] = setCatMode(f.cats[k], m)))}
                    />
                    <NumberField
                      value={c.m}
                      parse={parseMetres}
                      onChange={(v) => edit((f) => void (f.cats[k].m = v ?? 0))}
                      accessibilityLabel={`${l}, metres`}
                      editable={c.mode !== 'any'}
                      width={70}
                    />
                    <Label>m</Label>
                  </View>
                </View>
              );
            })}
          </Section>

          <Section title="My places">
            {filters.places.map((pl, n) => (
              <View key={n} style={[styles.card, { backgroundColor: t.surface }]}>
                <View style={styles.row}>
                  <Field
                    value={pl.name}
                    onChangeText={(s) => edit((f) => void (f.places[n]!.name = s))}
                    accessibilityLabel="Name"
                    style={{ flex: 1 }}
                  />
                  <Pressable
                    onPress={() => edit((f) => void f.places.splice(n, 1))}
                    accessibilityLabel="Remove"
                    hitSlop={10}
                  >
                    <Text style={{ color: t.muted, fontSize: 17 }}>✕</Text>
                  </Pressable>
                </View>
                <LocationEditor
                  value={pl.loc}
                  placeholder="Address"
                  onChange={(loc) => edit((f) => void (f.places[n]!.loc = loc))}
                  onPick={() => onPick({ kind: 'place', index: n })}
                />
                <View style={[styles.row, { flexWrap: 'wrap' }]}>
                  <Chips
                    label="Within or at least"
                    options={PLACE_CHIPS}
                    value={pl.mode}
                    onChange={(m) => edit((f) => void (f.places[n]!.mode = m))}
                  />
                  <NumberField
                    value={pl.m}
                    parse={parseMetres}
                    onChange={(v) => edit((f) => void (f.places[n]!.m = v ?? 0))}
                    accessibilityLabel="Metres"
                    width={70}
                  />
                  <Label>m</Label>
                </View>
              </View>
            ))}
            {filters.places.length < MAX_PLACES && (
              <Button
                title="+ Add a place"
                onPress={() => edit((f) => void f.places.push(newPlace()))}
              />
            )}
          </Section>

          <Section title="Results">
            <Legend filters={filters} />
            {summary ? <Results summary={summary} /> : <Hint>Calculating…</Hint>}
          </Section>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }),
);
