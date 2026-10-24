// Interface language for the phone app. The words live in i18n/strings.json
// (same file as the web app); missing words fall back to English. The choice
// is saved on the phone; the first launch follows the phone's language.
// Church-written content is never translated. Mirrors burden-app/src/lib/i18n.jsx.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import strings from '../i18n/strings.json';

type Dict = Record<string, string>;
const all = strings as unknown as Record<string, Dict> & { languages: Dict };
export const LANGUAGES = all.languages;
export type Lang = keyof typeof LANGUAGES;
const KEY = 'burden-lang';

function deviceLanguage(): string {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2);
    return all[l] ? l : 'en';
  } catch {
    return 'en';
  }
}

export function translate(lang: string, key: string, vars?: Record<string, string | number>): string {
  let s = all[lang]?.[key] ?? all.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

type Ctx = { lang: string; setLang: (l: string) => void; t: (k: string, v?: Record<string, string | number>) => string };
const I18n = createContext<Ctx>({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState(deviceLanguage);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => { if (saved && all[saved]) setLangState(saved); }).catch(() => {});
  }, []);
  const setLang = useCallback((l: string) => {
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  }, []);
  const value = useMemo(() => ({ lang, setLang, t: (k: string, v?: Record<string, string | number>) => translate(lang, k, v) }), [lang, setLang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
export const useT = () => useContext(I18n).t;
