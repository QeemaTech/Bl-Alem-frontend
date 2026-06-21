import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse } from '../utils/types';
import {
  applyBrandingTheme,
  DEFAULT_BRANDING,
  mergeBrandingSettings,
  readCachedBranding,
  writeCachedBranding,
  type BrandingSettings,
} from '../utils/theme';

interface SiteSettingsContextValue {
  settings: BrandingSettings;
  loaded: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

async function fetchPublicSettings(): Promise<BrandingSettings> {
  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/settings/public');
  return mergeBrandingSettings(data.data || {});
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(() => readCachedBranding() || DEFAULT_BRANDING);
  const [loaded, setLoaded] = useState(false);

  const apply = useCallback((next: BrandingSettings) => {
    setSettings(next);
    applyBrandingTheme(next);
    writeCachedBranding(next);
  }, []);

  const refreshSettings = useCallback(async () => {
    const next = await fetchPublicSettings();
    apply(next);
    setLoaded(true);
  }, [apply]);

  useEffect(() => {
    const cached = readCachedBranding();
    if (cached) applyBrandingTheme(cached);
    refreshSettings().catch(() => setLoaded(true));
  }, [refreshSettings]);

  const value = useMemo(
    () => ({ settings, loaded, refreshSettings }),
    [settings, loaded, refreshSettings],
  );

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  return ctx;
}
