import { useSyncExternalStore } from 'react'

// The origin never changes while the page is open, so there is nothing to subscribe to.
function subscribeNoop(): () => void {
  return () => {}
}

function getOrigin(): string {
  return window.location.origin
}

// No origin exists during SSR; callers already fall back for an empty string.
function getServerOrigin(): string {
  return ''
}

/** window.location.origin, hydration-safe: '' on the server and during hydration. */
export function useOrigin(): string {
  return useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin)
}
