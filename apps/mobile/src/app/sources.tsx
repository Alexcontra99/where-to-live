import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { meta } from '../lib/engine';
import { ATTRIBUTION } from '../lib/mapConfig';
import { useTheme } from '../lib/theme';

// Same list as the prototype's Sources tab (prototipo/index.html) and DATA-LICENSES.md
// (prototipo/build/export_web.sh).
const SOURCES = [
  'Public transport timetables (GTFS) — Administration des transports publics, CC BY 4.0',
  "Advertised rents — Observatoire de l'Habitat, CC0",
  'Strategic noise maps 2021 (roads, rail) and airport noise map 2023 — Administration de l’environnement, CC0',
  'Districts — Ville de Luxembourg, CC BY 4.0',
  'Communes, terrain model and base map — Administration du cadastre et de la topographie (ACT), CC0',
  "Childcare facilities 2021 — Ministère de l'Éducation nationale, CC0",
  'Places — © OpenStreetMap contributors, ODbL 1.0',
  'Places — Overture Maps Foundation, CDLA-Permissive-2.0 (includes Meta, Microsoft, Foursquare Apache-2.0, AllThePlaces CC0)',
  "Bike stations — Vel'oh! – JCDecaux, JCDecaux Open Licence",
  'Address search — geoportail.lu',
];

const ODBL =
  'The place data and the distances to places in this app are a derivative database made available under the Open Database License.';

export default function SourcesScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const h2 = { color: t.text, fontSize: 17, fontWeight: '600' as const, marginTop: 16 };
  const p = { color: t.text, fontSize: 15, lineHeight: 21 };
  const hint = { color: t.muted, fontSize: 13, lineHeight: 18 };
  // A link with Apple's 44 pt minimum touch target.
  const link = (url: string, label: string) => (
    <Pressable
      key={url}
      onPress={() => void Linking.openURL(url)}
      accessibilityRole="link"
      style={({ pressed }) => [
        { minHeight: 44, justifyContent: 'center' },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={{ color: t.primary, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
  return (
    <ScrollView
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 8 }}
    >
      <Text style={[h2, { marginTop: 0 }]}>Sources</Text>
      {SOURCES.map((s) => (
        <View key={s} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={p}>•</Text>
          <Text style={[p, { flex: 1 }]}>{s}</Text>
        </View>
      ))}
      <Text style={hint}>{ODBL}</Text>
      <View>
        {link('https://opendatacommons.org/licenses/odbl/', 'opendatacommons.org/licenses/odbl')}
        {link('https://www.openstreetmap.org/copyright', 'openstreetmap.org/copyright')}
      </View>
      <Text style={hint}>Map: {ATTRIBUTION}</Text>
      <Text style={hint}>
        Data built {meta.built ?? '—'}
        {meta.transit_day ? ` · timetables for ${meta.transit_day}` : ''}
      </Text>
      <Text style={h2}>Privacy</Text>
      <Text style={hint}>
        Nothing you enter is sent to us; your last filters are kept only on this device. Address
        searches and map tiles are loaded from geoportail.lu. Results are estimates from the data
        sources above.
      </Text>
    </ScrollView>
  );
}
