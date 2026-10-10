import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import type { CellInfo } from '@wtl/core';
import { useRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { XButton } from './controls';

/** Tap card for a cell: same content and wording as the prototype popup (app.js :250-285). */
export function CellSheet({ info, onClose }: { info: CellInfo; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const small = { color: t.muted, fontSize: 13 };
  const body = { color: t.text, fontSize: 15 };
  const sheet = useRef<BottomSheet>(null);
  const close = () => sheet.current?.close();
  return (
    <BottomSheet
      ref={sheet}
      index={0}
      enableDynamicSizing
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: t.bg }}
      handleIndicatorStyle={{ backgroundColor: t.border }}
    >
      <BottomSheetView
        style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 16, gap: 6 }}
        onAccessibilityEscape={close}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={
              info.area
                ? { color: t.text, fontSize: 18, fontWeight: '700', flex: 1 }
                : [body, { flex: 1 }]
            }
            accessibilityRole={info.area ? 'header' : undefined}
          >
            {info.area ? (
              <>
                {info.area.name} <Text style={small}>({info.area.kind})</Text>
              </>
            ) : (
              'Outside Luxembourg: not covered yet.'
            )}
          </Text>
          <XButton label="Close" onPress={close} />
        </View>
        {info.area && (
          <>
            {info.rent ? (
              <View>
                <Text style={[body, { fontWeight: '600' }]}>
                  Estimated asking rent for {info.rent.size} m²: about €{info.rent.eur} (€
                  {info.rent.low}–{info.rent.high})
                </Text>
                <Text style={small}>New builds: often up to 25% more</Text>
              </View>
            ) : (
              <Text style={small}>No rent data</Text>
            )}
            {info.commutes.map((c) => (
              <Text key={c.label} style={body}>
                {c.label}: {c.minutes} min ({c.modeLabel.toLowerCase()})
              </Text>
            ))}
            <Text style={body}>
              Noise:{' '}
              {info.noise
                .map((z) => `${z.label.split(' ')[0]!.toLowerCase()} ${z.words}`)
                .join(' · ')}
              {info.airNight !== null ? ` · aircraft at night ${info.airNight}+ dB` : ''}
            </Text>
            <Text style={small}>
              Nearest: {info.nearest.map((z) => `${z.label} ${z.text}`).join(' · ')}
            </Text>
            {info.checks &&
              (info.checks.fits ? (
                <Text style={{ color: t.ok, fontSize: 15 }}>✓ Fits all your filters</Text>
              ) : (
                info.checks.failed.map((f) => (
                  <Text key={f.check} style={{ color: t.fail, fontSize: 15 }}>
                    ✗ {f.name}
                  </Text>
                ))
              ))}
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}
