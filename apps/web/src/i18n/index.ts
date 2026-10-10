import type { LocaleId } from '../config';
import { en, type Dict } from './en';

// Only English ships today. Add `es: es` etc. here as translations land; missing locales fall back to English.
const dictionaries: Partial<Record<LocaleId, Dict>> = { en };

export function useStrings(locale: string | undefined): Dict {
  return dictionaries[locale as LocaleId] ?? en;
}
