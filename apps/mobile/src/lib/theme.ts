import { useColorScheme } from 'react-native';

// Colour tokens (light / dark), close to the prototype's GitHub-like palette.
const light = {
  bg: '#ffffff',
  surface: '#f6f8fa',
  text: '#1f2328',
  muted: '#59636e',
  border: '#d1d9e0',
  primary: '#0969da',
  onPrimary: '#ffffff',
  chip: '#eef1f4',
  chipOn: '#0969da',
  onChipOn: '#ffffff',
  ok: '#1a7f37',
  fail: '#cf222e',
  bar: '#8c8c8c',
  person: '#0969da',
  place: '#8250df',
};
export type Theme = typeof light;
const dark: Theme = {
  bg: '#0d1117',
  surface: '#161b22',
  text: '#e6edf3',
  muted: '#9198a1',
  border: '#3d444d',
  primary: '#4493f8',
  onPrimary: '#ffffff',
  chip: '#21262d',
  chipOn: '#4493f8',
  onChipOn: '#ffffff',
  ok: '#3fb950',
  fail: '#f85149',
  bar: '#8c8c8c',
  person: '#4493f8',
  place: '#a371f7',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
