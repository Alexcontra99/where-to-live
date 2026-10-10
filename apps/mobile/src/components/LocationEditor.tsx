import type { Place } from '@wtl/core';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { geocode } from '../lib/geocode';
import { useTheme } from '../lib/theme';
import { Button, Field, styles } from './controls';

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
  const [notFound, setNotFound] = useState(false);

  const search = async () => {
    if (!q.trim() || busy) return;
    setBusy(true);
    setNotFound(false);
    try {
      onChange(await geocode(q));
      setQ('');
    } catch {
      setNotFound(true);
    }
    setBusy(false);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: notFound ? t.fail : value ? t.text : t.muted, fontSize: 14 }}>
        {notFound
          ? 'Address not found in Luxembourg. Try another or pick on the map.'
          : (value?.label ?? 'No location yet')}
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
