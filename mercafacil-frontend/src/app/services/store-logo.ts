import { Store } from '../models/models';

const STORE_LOGO_MAP: Record<string, string> = {
  mcdonalds: 'assets/store-logos/mcdonalds.svg',
  popeyes: 'assets/store-logos/popeyes.svg',
  vips: 'assets/store-logos/vips.svg',
  'fosters hollywood': 'assets/store-logos/fosters-hollywood.svg',
  zara: 'assets/store-logos/zara.svg',
  primark: 'assets/store-logos/primark.svg',
  mediamarkt: 'assets/store-logos/mediamarkt.svg',
  game: 'assets/store-logos/game.png',
  decathlon: 'assets/store-logos/decathlon.svg',
  tiendanimal: 'assets/store-logos/tiendanimal.ico',
};

function normalizeStoreName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getStoreLogoUrl(name: string): string | null {
  return STORE_LOGO_MAP[normalizeStoreName(name)] ?? null;
}

export function attachStoreLogo<T extends Store>(store: T): T & { logoUrl?: string } {
  return {
    ...store,
    logoUrl: getStoreLogoUrl(store.name) ?? undefined,
  };
}
