import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  ARRIVE_OPTS,
  CATS,
  MAX_PEOPLE,
  MAX_PLACES,
  MODES,
  NOISE,
  NOISE_OPTS,
  type CatMode,
  type Filters,
  type Summary,
} from '@wtl/core';
import { forwardRef, memo, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  newUiPerson,
  newUiPlace,
  parseMax,
  parseMetres,
  parseOptional,
  setCatMode,
  type UiFilters,
  type UiPerson,
  type UiPlace,
} from '../lib/filters';
import { useTheme } from '../lib/theme';
import {
  Button,
  Chips,
  Field,
  Hint,
  Label,
  NumberField,
  Section,
  XButton,
  styles,
} from './controls';
import { LocationEditor } from './LocationEditor';
import { Legend, Results } from './Results';

/** A person or place card, by its stable id. */
export type PickTarget = { kind: 'person' | 'place'; id: string };

/** An edit applied to the latest filters (not to a copy captured earlier, e.g. before an address search). */
export type Edit = (fn: (f: UiFilters) => void) => void;

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

/** Collapsed height at the default text size; larger text grows it to fit the header. */
export const MIN_SNAP = 128;
const HANDLE_H = 24;

interface Props {
  filters: UiFilters;
  /** Filters of the evaluation on screen (for the legend), null before the first one. */
  evaluated: Filters | null;
  onEdit: Edit;
  onPick: (target: PickTarget) => void;
  summary: Summary | null;
  computing: boolean;
  failed: boolean;
  onExample: () => void;
  onSources: () => void;
}

export const FilterSheet = memo(
  forwardRef<BottomSheet, Props>(function FilterSheet(
    { filters, evaluated, onEdit: edit, onPick, summary, computing, failed, onExample, onSources },
    ref,
  ) {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const [headerH, setHeaderH] = useState(0);
    const snapPoints = useMemo(
      () => [Math.max(MIN_SNAP, Math.ceil(headerH + HANDLE_H)), '50%', '92%'],
      [headerH],
    );
    // Edits find their card by id in the latest filters; a card removed meanwhile is a no-op.
    const editPerson = (id: string, fn: (p: UiPerson) => void) =>
      edit((f) => {
        const p = f.people.find((x) => x.id === id);
        if (p) fn(p);
      });
    const editPlace = (id: string, fn: (p: UiPlace) => void) =>
      edit((f) => {
        const p = f.places.find((x) => x.id === id);
        if (p) fn(p);
      });

    const status = failed
      ? 'Could not calculate'
      : computing || !summary
        ? 'Calculating…'
        : `${summary.fitKm2Label} fit`;

    // accessibilityLiveRegion is Android only: on iOS, VoiceOver hears each finished result here.
    useEffect(() => {
      if (Platform.OS === 'ios' && !computing && (failed || summary))
        AccessibilityInfo.announceForAccessibility(status);
    }, [status, computing, failed, summary]);

    return (
      <BottomSheet
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: t.bg }}
        handleIndicatorStyle={{ backgroundColor: t.border }}
      >
        <View
          style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 2 }}
          onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        >
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', flexShrink: 1 }}>
              Where to live
            </Text>
            <Pressable
              onPress={onSources}
              accessibilityRole="button"
              style={{
                minHeight: 44,
                minWidth: 44,
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
              <Text style={{ color: t.primary, fontSize: 15 }}>Sources</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            {computing && <ActivityIndicator size="small" />}
            <Text
              style={{ color: failed ? t.fail : t.muted, fontSize: 14, flexShrink: 1 }}
              numberOfLines={2}
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
            {filters.people.map((p, n) => {
              const label = p.label ?? `Person ${n + 1}`;
              return (
                <View key={p.id} style={[styles.card, { backgroundColor: t.surface }]}>
                  <View style={[styles.row, { justifyContent: 'space-between', minHeight: 44 }]}>
                    <Label>{label}</Label>
                    {n > 0 && (
                      <XButton
                        label={`Remove ${label}`}
                        onPress={() =>
                          edit((f) => void (f.people = f.people.filter((x) => x.id !== p.id)))
                        }
                      />
                    )}
                  </View>
                  <LocationEditor
                    value={p.dest}
                    placeholder="Work or study address"
                    label={`${label}, work or study address`}
                    onChange={(loc) => editPerson(p.id, (x) => void (x.dest = loc))}
                    onPick={() => onPick({ kind: 'person', id: p.id })}
                  />
                  <Chips
                    label="Mode"
                    options={MODES}
                    value={p.mode}
                    onChange={(m) => editPerson(p.id, (x) => void (x.mode = m))}
                  />
                  <View style={styles.row}>
                    <Label>max</Label>
                    <NumberField
                      value={p.max}
                      parse={parseMax}
                      onChange={(v) => editPerson(p.id, (x) => void (x.max = v ?? 30))}
                      accessibilityLabel={`${label}, max minutes`}
                      width={64}
                    />
                    <Label>min</Label>
                  </View>
                </View>
              );
            })}
            {filters.people.length < MAX_PEOPLE && (
              <Button
                title="+ Add a second person"
                onPress={() =>
                  edit((f) => {
                    if (f.people.length < MAX_PEOPLE) f.people.push(newUiPerson(f.people.length));
                  })
                }
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
              <View style={{ flexShrink: 1 }}>
                <Label>Budget per month (€, optional)</Label>
              </View>
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
            {filters.places.map((pl) => {
              const name = pl.name.trim() || 'My place';
              return (
                <View key={pl.id} style={[styles.card, { backgroundColor: t.surface }]}>
                  <View style={styles.row}>
                    <Field
                      value={pl.name}
                      onChangeText={(s) => editPlace(pl.id, (x) => void (x.name = s))}
                      accessibilityLabel={`${name}, name`}
                      style={{ flex: 1 }}
                    />
                    <XButton
                      label={`Remove ${name}`}
                      onPress={() =>
                        edit((f) => void (f.places = f.places.filter((x) => x.id !== pl.id)))
                      }
                    />
                  </View>
                  <LocationEditor
                    value={pl.loc}
                    placeholder="Address"
                    label={`${name}, address`}
                    onChange={(loc) => editPlace(pl.id, (x) => void (x.loc = loc))}
                    onPick={() => onPick({ kind: 'place', id: pl.id })}
                  />
                  <View style={[styles.row, { flexWrap: 'wrap' }]}>
                    <Chips
                      label="Within or at least"
                      options={PLACE_CHIPS}
                      value={pl.mode}
                      onChange={(m) => editPlace(pl.id, (x) => void (x.mode = m))}
                    />
                    <NumberField
                      value={pl.m}
                      parse={parseMetres}
                      onChange={(v) => editPlace(pl.id, (x) => void (x.m = v ?? 0))}
                      accessibilityLabel={`${name}, metres`}
                      width={70}
                    />
                    <Label>m</Label>
                  </View>
                </View>
              );
            })}
            {filters.places.length < MAX_PLACES && (
              <Button
                title="+ Add a place"
                onPress={() =>
                  edit((f) => {
                    if (f.places.length < MAX_PLACES) f.places.push(newUiPlace());
                  })
                }
              />
            )}
          </Section>

          <Section title="Results">
            <Legend filters={evaluated ?? filters} />
            {summary ? <Results summary={summary} /> : <Hint>Calculating…</Hint>}
          </Section>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }),
);
