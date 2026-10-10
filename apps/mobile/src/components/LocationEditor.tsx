import type { Place } from '@wtl/core';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { geocode, isNotFound } from '../lib/geocode';
import { useTheme } from '../lib/theme';
import { Button, Field, styles } from './controls';

const MESSAGES = {
  notFound: 'Address not found in Luxembourg. Try another or pick on the map.',
  offline: 'No connection. Try again or pick on the map.',
} as const;

/** Address search (geoportail.lu) or pick on the map; same flow as the prototype's locationEditor. */
export function LocationEditor({
  value,
  placeholder,
  onChange,
  onPick,
}: {
  value: Place | null;
  placeholder: string;
  onChange: (p: Place) => void;
  onPick: () => void;
}) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<keyof typeof MESSAGES | null>(null);

  // A new location (search or pick on the map) replaces the message, as app.js set() does.
  useEffect(() => setFailed(null), [value?.lat, value?.lon, value?.label]);

  const search = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    setFailed(null);
    try {
      onChange(await geocode(q));
      setQ('');
    } catch (e) {
      setFailed(isNotFound(e) ? 'notFound' : 'offline');
    }
    setBusy(false);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: failed ? t.fail : value ? t.text : t.muted, fontSize: 14 }}>
        {failed ? MESSAGES[failed] : (value?.label ?? 'No location yet')}
      </Text>
      <View style={styles.row}>
        <Field
          value={q}
          onChangeText={setQ}
          placeholder={placeholder}
          returnKeyType="search"
          onSubmitEditing={search}
          autoCorrect={false}
          accessibilityLabel={placeholder}
          style={{ flex: 1 }}
        />
        {busy ? (
          <ActivityIndicator style={{ width: 64 }} />
        ) : (
          <Button title="Search" kind="primary" onPress={search} />
        )}
      </View>
      <Button title="Pick on map" onPress={onPick} />
    </View>
  );
}
