import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createThemeStore, parseTheme } from './theme-store'

function makeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

const throwingStorage = {
  getItem: (): string | null => {
    throw new Error('SecurityError')
  },
  setItem: (): void => {
    throw new Error('SecurityError')
  },
}

test('parseTheme keeps a known theme', () => {
  const result = parseTheme('light')

  assert.equal(result, 'light')
})

test('parseTheme falls back to dark for an unknown value', () => {
  const result = parseTheme('solarized')

  assert.equal(result, 'dark')
})

test('getSnapshot defaults to dark when nothing is stored', () => {
  const store = createThemeStore(() => makeStorage())

  const result = store.getSnapshot()

  assert.equal(result, 'dark')
})

test('getSnapshot reads the stored theme', () => {
  const store = createThemeStore(() => makeStorage({ theme: 'light' }))

  const result = store.getSnapshot()

  assert.equal(result, 'light')
})

test('getSnapshot falls back to dark when storage throws', () => {
  const store = createThemeStore(() => throwingStorage)

  const result = store.getSnapshot()

  assert.equal(result, 'dark')
})

test('toggle persists the other theme', () => {
  const storage = makeStorage({ theme: 'dark' })
  const store = createThemeStore(() => storage)

  store.toggle()

  assert.equal(storage.getItem('theme'), 'light')
})

test('toggle notifies subscribers', () => {
  const store = createThemeStore(() => makeStorage())
  let notified = 0
  store.subscribe(() => {
    notified += 1
  })

  store.toggle()

  assert.equal(notified, 1)
})

test('an unsubscribed listener is no longer notified', () => {
  const store = createThemeStore(() => makeStorage())
  let notified = 0
  const unsubscribe = store.subscribe(() => {
    notified += 1
  })
  unsubscribe()

  store.toggle()

  assert.equal(notified, 0)
})

test('toggle neither notifies nor throws when storage is unavailable', () => {
  const store = createThemeStore(() => throwingStorage)
  let notified = 0
  store.subscribe(() => {
    notified += 1
  })

  store.toggle()

  assert.equal(notified, 0)
})
