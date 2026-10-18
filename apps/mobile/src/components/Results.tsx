import {
  ONE_AWAY_COLOUR,
  RENT_BUDGET,
  RENT_M2,
  refSize,
  type Filters,
  type Summary,
} from '@wtl/core';
import { Text, View } from 'react-native';
import { rgba } from '../lib/mapFill';
import { rentText } from '../lib/rent';
import { useTheme } from '../lib/theme';
import { Hint } from './controls';

const solid = (c: readonly number[]) => rgba([c[0]!, c[1]!, c[2]!, 255]);

function Swatch({ colour, label }: { colour: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: colour }} />
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

/** Map legend (app.js summary): rent against budget, or €/m² for the chosen size, plus "one filter away". */
export function Legend({ filters }: { filters: Pick<Filters, 'budget' | 'size'> }) {
  const t = useTheme();
  const S = refSize(filters.size);
  const byBudget = !!(filters.budget && filters.size);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {byBudget ? (
        RENT_BUDGET.map(([, c, l]) => <Swatch key={l} colour={solid(c)} label={l} />)
      ) : (
        <>
          <Text style={{ color: t.muted, fontSize: 12 }}>€/m², {S} m²:</Text>
          {RENT_M2.map(([top, c], j) => {
            const prev = RENT_M2[j - 1]?.[0];
            const label = j === 0 ? `<${top}` : top === Infinity ? `${prev}+` : `${prev}–${top}`;
            return <Swatch key={label} colour={solid(c)} label={label} />;
          })}
        </>
      )}
      <Swatch colour={solid(ONE_AWAY_COLOUR)} label="One filter away" />
    </View>
  );
}

export function Results({ summary }: { summary: Summary }) {
  const t = useTheme();
  const n = summary.areaCount;
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: t.text, fontSize: 15 }}>
        <Text style={{ fontWeight: '700' }}>{summary.fitKm2Label}</Text> fit · {n} district
        {n === 1 ? '' : 's'} or commune{n === 1 ? '' : 's'}
      </Text>
      {summary.topAreas.length ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>Areas with most matching space</Text>
          {summary.topAreas.map((a, j) => (
            <Text key={a.area} style={{ color: t.text, fontSize: 14 }}>
              {j + 1}. {a.name}{' '}
              <Text style={{ color: t.muted }}>
                · {a.km2Label} · {rentText(a, summary.size)}
              </Text>
            </Text>
          ))}
        </View>
      ) : (
        <Hint>Nothing fits all filters. The grey areas show what is one filter away.</Hint>
      )}
      {summary.blockers.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={{ color: t.text, fontWeight: '600' }}>What blocks the grey areas</Text>
          {summary.blockers.map((b) => (
            <View key={b.check} style={{ gap: 3 }}>
              <Text style={{ color: t.text, fontSize: 14 }}>
                {b.short} · {b.km2Label}
              </Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: t.track }}>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${100 * b.share}%`,
                    backgroundColor: t.warn,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
