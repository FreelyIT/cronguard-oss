export type Theme = 'light' | 'dark'

export const DEFAULT_THEME: Theme = 'dark'
const STORAGE_KEY = 'theme'

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>

export interface ThemeStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): Theme
  toggle(): void
}

/** Anything other than a known theme (missing, tampered with) falls back to the default. */
export function parseTheme(value: string | null): Theme {
  return value === 'light' || value === 'dark' ? value : DEFAULT_THEME
}

/**
 * External store for useSyncExternalStore. `getStorage` is called lazily so the
 * store can be created at module scope without touching `window` during SSR.
 * Storage access can throw (disabled cookies, some private modes). A failed
 * read falls back to the default; a failed write makes toggle() a no-op.
 */
export function createThemeStore(getStorage: () => ThemeStorage): ThemeStore {
  const listeners = new Set<() => void>()

  function getSnapshot(): Theme {
    try {
      return parseTheme(getStorage().getItem(STORAGE_KEY))
    } catch {
      return DEFAULT_THEME
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot,
    toggle() {
      const next: Theme = getSnapshot() === 'light' ? 'dark' : 'light'
      try {
        getStorage().setItem(STORAGE_KEY, next)
      } catch {
        return
      }
      listeners.forEach((listener) => listener())
    },
  }
}
