export interface PlatformSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  instructorRegistrationEnabled: boolean;
}

export const DEFAULT_PLATFORM: PlatformSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  instructorRegistrationEnabled: true,
};

export function isSettingTruthy(value?: string): boolean {
  return value === 'true' || value === '1';
}

export function parsePlatformSettings(raw: Record<string, string | undefined>): PlatformSettings {
  return {
    maintenanceMode: isSettingTruthy(raw.maintenanceMode),
    registrationEnabled: raw.registrationEnabled === undefined
      ? true
      : isSettingTruthy(raw.registrationEnabled),
    instructorRegistrationEnabled: raw.instructorRegistrationEnabled === undefined
      ? true
      : isSettingTruthy(raw.instructorRegistrationEnabled),
  };
}
