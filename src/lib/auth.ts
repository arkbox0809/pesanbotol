const DEVICE_TOKEN_KEY = 'pesanbotol_device_token';
const SPECIAL_BOTTLE_ACCESS_KEY = 'pesanbotol_has_special_bottles';
const ARCHIVE_ACCESS_KEY = 'pesanbotol_has_archive';

export const SPECIAL_BOTTLE_VARIANTS = ['anchor', 'crystal', 'jade', 'lantern'] as const;
export type SpecialBottleType = (typeof SPECIAL_BOTTLE_VARIANTS)[number];
export type SupportConfirmation =
  | { product: 'special-bottle'; variant: SpecialBottleType }
  | { product: 'archive' }
  | { product: 'tip' };

function createDeviceUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export function getDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const existingToken = window.localStorage.getItem(DEVICE_TOKEN_KEY);
    if (existingToken) return existingToken;

    const token = createDeviceUuid();
    window.localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}

export function getUnlockedSpecialBottles(): SpecialBottleType[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedAccess = window.localStorage.getItem(SPECIAL_BOTTLE_ACCESS_KEY);
    if (!storedAccess) return [];
    if (storedAccess === 'true') return [...SPECIAL_BOTTLE_VARIANTS];

    const parsed: unknown = JSON.parse(storedAccess);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((variant): variant is SpecialBottleType =>
      SPECIAL_BOTTLE_VARIANTS.includes(variant as SpecialBottleType)
    );
  } catch {
    return [];
  }
}

export function hasSpecialBottleAccess(variant?: SpecialBottleType): boolean {
  const unlockedVariants = getUnlockedSpecialBottles();
  return variant ? unlockedVariants.includes(variant) : unlockedVariants.length > 0;
}

export function grantSpecialBottleAccess(variant: SpecialBottleType): void {
  if (typeof window === 'undefined') return;

  try {
    const unlockedVariants = new Set(getUnlockedSpecialBottles());
    unlockedVariants.add(variant);
    window.localStorage.setItem(SPECIAL_BOTTLE_ACCESS_KEY, JSON.stringify([...unlockedVariants]));
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}

export function hasArchiveAccess(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(ARCHIVE_ACCESS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function grantArchiveAccess(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(ARCHIVE_ACCESS_KEY, 'true');
  } catch {
    // Storage may be unavailable in private browsing or restricted contexts.
  }
}