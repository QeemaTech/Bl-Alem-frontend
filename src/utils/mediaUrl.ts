/** Resolve stored upload paths for display in the browser (via Vite proxy or absolute API host). */
export function normalizeStoredMediaPath(url?: string | null) {
  if (!url?.trim()) return '';
  let path = url.trim().replace(/\/+$/, '');
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  if (!path.startsWith('/')) path = `/${path}`;
  return path;
}

export function mediaUrl(url?: string | null) {
  const path = normalizeStoredMediaPath(url);
  return path;
}

export function normalizeHexColor(raw: string, fallback = '#22A6BC') {
  const value = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    const [r, g, b] = value.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(value)) return `#${value.toUpperCase()}`;
  return fallback;
}
