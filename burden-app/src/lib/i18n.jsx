// Interface language for the web app. The words live in i18n/strings.json
// (same file in the phone app); missing words fall back to English. The
// choice is remembered in this browser; the first visit follows the
// browser's language. Church-written content is never translated.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import strings from '../i18n/strings.json'

export const LANGUAGES = strings.languages
const KEY = 'burden-lang'

function firstLanguage() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && strings[saved]) return saved
  } catch { /* private mode */ }
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2)
  return strings[nav] ? nav : 'en'
}

export function translate(lang, key, vars) {
  let s = strings[lang]?.[key] ?? strings.en[key] ?? key
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

const I18n = createContext({ lang: 'en', setLang: () => {}, t: (k, v) => translate('en', k, v) })

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(firstLanguage)
  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* private mode */ }
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const value = useMemo(() => ({ lang, setLang, t: (k, v) => translate(lang, k, v) }), [lang, setLang])
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export const useI18n = () => useContext(I18n)
export const useT = () => useContext(I18n).t
