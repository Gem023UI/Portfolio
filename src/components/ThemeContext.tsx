import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';

export type ThemeMode = 'light' | 'system' | 'dark';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
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

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall back silently
  }
  return 'system';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemPreference() : mode;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(mode));

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
      const nextResolved = resolve(next);
      applyTheme(nextResolved);
      setModeState(next);
      setResolvedTheme(nextResolved);
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
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!supportsViewTransition || prefersReducedMotion) {
        commitMode(next);
        return;
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

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

  // While in "system" mode, keep following the OS setting live.
  // No reveal animation here — this fires from an OS-level change, not a user click.
  useEffect(() => {
    if (mode !== 'system') return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? 'dark' : 'light';
      applyTheme(next);
      setResolvedTheme(next);
    };
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme, setMode, setModeAtPoint }),
    [mode, resolvedTheme, setMode, setModeAtPoint]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}