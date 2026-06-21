import { mediaUrl, normalizeHexColor, normalizeStoredMediaPath } from './mediaUrl';

export interface BrandingSettings {
  platformName: string;
  platformTagline: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  metaTitle: string;
  metaDescription: string;
}

export const DEFAULT_BRANDING: BrandingSettings = {
  platformName: 'BI-ALEM / بالعِلم',
  platformTagline: 'منصة تعليمية متكاملة',
  logo: '',
  favicon: '',
  primaryColor: '#22A6BC',
  secondaryColor: '#1E293B',
  metaTitle: 'BI-ALEM | بالعِلم',
  metaDescription: '',
};

const SETTINGS_CACHE_KEY = 'bi_alem_branding_cache';

function hexToRgb(hex: string) {
  const value = normalizeHexColor(hex, '#22A6BC').slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function mixHex(hex: string, target: 'white' | 'black', amount: number) {
  const { r, g, b } = hexToRgb(hex);
  const t = target === 'white' ? 255 : 0;
  return rgbToHex(r + (t - r) * amount, g + (t - g) * amount, b + (t - b) * amount);
}

export function applyBrandingTheme(settings: BrandingSettings) {
  const primary = normalizeHexColor(settings.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondary = normalizeHexColor(settings.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const root = document.documentElement;

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-dark', mixHex(primary, 'black', 0.18));
  root.style.setProperty('--primary-light', mixHex(primary, 'white', 0.88));
  root.style.setProperty('--primary-50', mixHex(primary, 'white', 0.94));
  root.style.setProperty('--secondary', secondary);
  root.style.setProperty('--shadow', `0 8px 30px ${primary}14`);
  root.style.setProperty('--shadow-lg', `0 18px 45px ${primary}1A`);

  const faviconHref = mediaUrl(normalizeStoredMediaPath(settings.favicon || settings.logo));
  if (faviconHref) {
    let link = document.querySelector<HTMLLinkElement>('link[data-brand-favicon="true"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.setAttribute('data-brand-favicon', 'true');
      document.head.appendChild(link);
    }
    link.href = faviconHref;
  }

  if (settings.metaTitle?.trim()) {
    document.title = settings.metaTitle.trim();
  }
}

export function mergeBrandingSettings(raw: Record<string, string | undefined>): BrandingSettings {
  return {
    platformName: raw.platformName?.trim() || DEFAULT_BRANDING.platformName,
    platformTagline: raw.platformTagline?.trim() || DEFAULT_BRANDING.platformTagline,
    logo: normalizeStoredMediaPath(raw.logo || ''),
    favicon: normalizeStoredMediaPath(raw.favicon || ''),
    primaryColor: normalizeHexColor(raw.primaryColor || '', DEFAULT_BRANDING.primaryColor),
    secondaryColor: normalizeHexColor(raw.secondaryColor || '', DEFAULT_BRANDING.secondaryColor),
    metaTitle: raw.metaTitle?.trim() || DEFAULT_BRANDING.metaTitle,
    metaDescription: raw.metaDescription?.trim() || DEFAULT_BRANDING.metaDescription,
  };
}

export function readCachedBranding(): BrandingSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (!raw) return null;
    return mergeBrandingSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeCachedBranding(settings: BrandingSettings) {
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
}

export function splitPlatformName(name: string) {
  const parts = name.split('/').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return { title: parts[1], subtitle: parts[0] };
  return { title: name, subtitle: 'BI-ALEM' };
}
