import { useState, useEffect, useCallback } from 'react';
import { APPS_SCRIPT_URL } from '../firebase';

const MENU_CACHE_KEY = 'smart_diet_menu_cache_v1';

export function useMenuData() {
  const [menuData, setMenuData] = useState(() => {
    try {
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const syncMenuFromSheet = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      if (data?.menu) {
        setMenuData(data);
        localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Ошибка синхронизации меню:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncMenuFromSheet();
  }, [syncMenuFromSheet]);

  return {
    menuData,
    isSyncing,
    syncMenuFromSheet
  };
}
