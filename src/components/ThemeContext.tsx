import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type ThemeMode = 'morning' | 'sunset' | 'night';
export const THEME_MODES: ThemeMode[] = ['morning', 'sunset', 'night'];

interface ThemeContextValue {
  mode: ThemeMode;
  /** Kept for compatibility with existing consumers; identical to `mode` now that there is no "system" option. */
  resolvedTheme: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Same as setMode, but plays a radial-reveal animation expanding from (x, y) — e.g. a click point. */
  setModeAtPoint: (mode: ThemeMode, x: number, y: number) => void;
}

// Must match the key read by the blocking script in index.html
const STORAGE_KEY = 'jm-portfolio-theme-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void>; finished: Promise<void> };
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'morning' || value === 'sunset' || value === 'night';
}

/** Default theme from the visitor's local clock: 05:00-16:59 morning, 17:00-18:59 sunset, otherwise night. */
export function getTimeBasedTheme(date: Date = new Date()): ThemeMode {
  const hour = date.getHours();
  if (hour >= 5 && hour < 17) return 'morning';
  if (hour >= 17 && hour < 19) return 'sunset';
  return 'night';
}

function getStoredMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeMode(stored)) return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back silently
  }
  return null;
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // A stored choice wins; otherwise follow the visitor's clock. The clock-based
  // default is NOT persisted, so it keeps following the time until they pick a theme.
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode() ?? getTimeBasedTheme());

  const persist = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures
    }
  }, []);

  // Applies the DOM attribute and React state in one synchronous step, so it can
  // be safely wrapped in flushSync + startViewTransition for the reveal animation.
  const commitMode = useCallback(
    (next: ThemeMode) => {
      applyTheme(next);
      setModeState(next);
      persist(next);
    },
    [persist]
  );

  const setMode = useCallback(
    (next: ThemeMode) => {
      commitMode(next);
    },
    [commitMode]
  );

  const setModeAtPoint = useCallback(
    (next: ThemeMode, x: number, y: number) => {
      const doc = document as DocumentWithViewTransitions;
      const supportsViewTransition = typeof doc.startViewTransition === 'function';
      const prefersReducedMotion =
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!supportsViewTransition || prefersReducedMotion) {
        commitMode(next);
        return;
      }

      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      document.documentElement.style.setProperty('--theme-reveal-x', `${x}px`);
      document.documentElement.style.setProperty('--theme-reveal-y', `${y}px`);
      document.documentElement.style.setProperty('--theme-reveal-radius', `${endRadius}px`);

      doc.startViewTransition!(() => {
        flushSync(() => {
          commitMode(next);
        });
      });
    },
    [commitMode]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme: mode, setMode, setModeAtPoint }),
    [mode, setMode, setModeAtPoint]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}