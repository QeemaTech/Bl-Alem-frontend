import platformLogoUrl from '../assets/logo.png';
import { mediaUrl } from './mediaUrl';

export const DEFAULT_PLATFORM_LOGO = platformLogoUrl;

export function resolvePlatformLogo(logo?: string | null) {
  return mediaUrl(logo) || DEFAULT_PLATFORM_LOGO;
}
