'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'
import { createThemeStore, DEFAULT_THEME, type Theme } from '@/lib/theme-store'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Module scope is safe: the store only touches localStorage when React asks for a
// client snapshot, never during SSR.
const themeStore = createThemeStore(() => window.localStorage)

// The server cannot see localStorage; render the default and let hydration correct it.
function getServerTheme(): Theme {
  return DEFAULT_THEME
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, getServerTheme)

  useEffect(() => {
    const root = document.documentElement
    // Toggle both class and data-theme attribute so design CSS that targets
    // [data-theme="dark"] AND Tailwind utilities targeting .dark both work.
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    root.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: themeStore.toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
