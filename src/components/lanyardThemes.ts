import { THEME_MODES, type ThemeMode } from './ThemeContext';

// ---------------------------------------------------------------------------
// PASTE YOUR PER-THEME LANYARD IMAGE URLS HERE.
//   strap : the repeating lanyard band texture (png)
//   front : image on the front face of the card
//   back  : image on the back face of the card
// Leave a field as '' and it falls back to the MORNING value, so nothing breaks
// while you are still collecting the images.
// ---------------------------------------------------------------------------
export interface LanyardAssets {
  strap: string;
  front: string;
  back: string;
}

export const LANYARD_ASSETS: Record<ThemeMode, LanyardAssets> = {
  morning: {
    strap: '/lanyard.png',
    front: 'https://res.cloudinary.com/dxnb2ozgw/image/upload/v1790004010/lanyardfront2_iyxvlq.png',
    back: 'https://res.cloudinary.com/dxnb2ozgw/image/upload/v1790000723/lanyardback_ld232n.png',
  },
  sunset: {
    strap: '', // paste URL
    front: '', // paste URL
    back: '', // paste URL
  },
  night: {
    strap: '', // paste URL
    front: '', // paste URL
    back: '', // paste URL
  },
};

export function getLanyardAssets(mode: ThemeMode): LanyardAssets {
  const base = LANYARD_ASSETS.morning;
  const own = LANYARD_ASSETS[mode];
  return {
    strap: own.strap || base.strap,
    front: own.front || base.front,
    back: own.back || base.back,
  };
}

/** Every distinct URL across all themes (used to preload so a theme switch doesn't flash). */
export function allLanyardUrls(): string[] {
  const urls = new Set<string>();
  THEME_MODES.forEach((m) => {
    const a = getLanyardAssets(m);
    [a.strap, a.front, a.back].forEach((u) => u && urls.add(u));
  });
  return [...urls];
}