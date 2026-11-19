import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext({
  language: 'ru', // 'ru' | 'uk' | 'en'
  setLanguage: () => {},
  t: (path) => path
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('app_language');
    if (saved && ['ru', 'uk', 'en'].includes(saved)) {
      return saved;
    }
    // Определение языка браузера
    if (typeof navigator !== 'undefined' && navigator.language) {
      const code = navigator.language.slice(0, 2).toLowerCase();
      if (code === 'uk' || code === 'ua') return 'uk';
      if (code === 'en') return 'en';
    }
    return 'ru';
  });

  const setLanguage = (lang) => {
    if (['ru', 'uk', 'en'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('app_language', lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Функция получения перевода по ключу (например: t('nav.menu'))
  const t = (path, fallback = '') => {
    const keys = path.split('.');
    let cur = translations[language];
    for (const k of keys) {
      if (cur && cur[k] !== undefined) {
        cur = cur[k];
      } else {
        // Fallback на русский или ключ
        let ruCur = translations['ru'];
        for (const rk of keys) {
          if (ruCur && ruCur[rk] !== undefined) {
            ruCur = ruCur[rk];
          } else {
            return fallback || path;
          }
        }
        return ruCur;
      }
    }
    return cur;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
