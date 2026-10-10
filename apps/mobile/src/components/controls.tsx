import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInputProps } from 'react-native';
import { useTheme } from '../lib/theme';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.h2, { color: t.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.hint, { color: t.muted }]}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.label, { color: t.text }]}>{children}</Text>;
}

/** Segmented choice (replaces the prototype's <select>). */
export function Chips<V extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly (readonly [V, string])[];
  value: V;
  onChange: (v: V) => void;
  label?: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(([v, text]) => {
        const on = v === value;
        return (
          <Pressable
            key={String(v)}
            onPress={() => onChange(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.chip, { backgroundColor: on ? t.chipOn : t.chip }]}
          >
            <Text style={{ color: on ? t.onChipOn : t.text, fontSize: 14 }}>{text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  title,
  onPress,
  kind = 'ghost',
  disabled,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: t.primary }
          : { borderColor: t.border, borderWidth: StyleSheet.hairlineWidth },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={{ color: primary ? t.onPrimary : t.primary, fontSize: 15, fontWeight: '500' }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const t = useTheme();
  return (
    <BottomSheetTextInput
      placeholderTextColor={t.muted}
      {...props}
      style={[
        styles.input,
        { color: t.text, borderColor: t.border, backgroundColor: t.bg },
        props.style,
      ]}
    />
  );
}

/**
 * Numeric input that keeps the typed text while editing and reports the parsed number.
 * Shows the new value when it changes from outside (e.g. "Load an example").
 */
export function NumberField({
  value,
  parse,
  onChange,
  placeholder,
  accessibilityLabel,
  width = 76,
  editable = true,
}: {
  value: number | null;
  parse: (text: string) => number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  accessibilityLabel: string;
  width?: number;
  editable?: boolean;
}) {
  const shown = value === null ? '' : String(value);
  const [text, setText] = useState(shown);
  useEffect(() => {
    setText((cur) => (parse(cur) === value ? cur : shown));
    // Only react to outside changes of the value.
  }, [value]);
  return (
    <Field
      value={text}
      onChangeText={(s) => {
        setText(s);
        onChange(parse(s));
      }}
      keyboardType="number-pad"
      inputMode="numeric"
      placeholder={placeholder}
      accessibilityLabel={accessibilityLabel}
      editable={editable}
      style={{ width, textAlign: 'right', opacity: editable ? 1 : 0.5 }}
    />
  );
}

export const styles = StyleSheet.create({
  section: { paddingVertical: 12, gap: 8 },
  h2: { fontSize: 17, fontWeight: '600' },
  hint: { fontSize: 13 },
  label: { fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { borderRadius: 10, padding: 12, gap: 8 },
});
