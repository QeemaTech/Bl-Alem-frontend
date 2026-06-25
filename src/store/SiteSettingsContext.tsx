import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse } from '../utils/types';
import {
  DEFAULT_PLATFORM,
  parsePlatformSettings,
  type PlatformSettings,
} from '../utils/platformSettings';
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
  platform: PlatformSettings;
  loaded: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

async function fetchPublicSettings(): Promise<{ branding: BrandingSettings; platform: PlatformSettings }> {
  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/settings/public');
  const raw = data.data || {};
  return {
    branding: mergeBrandingSettings(raw),
    platform: parsePlatformSettings(raw),
  };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(() => readCachedBranding() || DEFAULT_BRANDING);
  const [platform, setPlatform] = useState<PlatformSettings>(DEFAULT_PLATFORM);
  const [loaded, setLoaded] = useState(false);

  const apply = useCallback((branding: BrandingSettings, nextPlatform: PlatformSettings) => {
    setSettings(branding);
    setPlatform(nextPlatform);
    applyBrandingTheme(branding);
    writeCachedBranding(branding);
  }, []);

  const refreshSettings = useCallback(async () => {
    const { branding, platform: nextPlatform } = await fetchPublicSettings();
    apply(branding, nextPlatform);
    setLoaded(true);
  }, [apply]);

  useEffect(() => {
    const cached = readCachedBranding();
    if (cached) applyBrandingTheme(cached);
    refreshSettings().catch(() => setLoaded(true));
  }, [refreshSettings]);

  const value = useMemo(
    () => ({ settings, platform, loaded, refreshSettings }),
    [settings, platform, loaded, refreshSettings],
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
