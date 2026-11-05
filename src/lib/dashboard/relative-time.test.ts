import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRelativeTime } from './relative-time'

const NOW = Date.parse('2026-10-15T12:00:00Z')

test('formatRelativeTime says Never without a timestamp', () => {
  const result = formatRelativeTime(null, NOW)

  assert.equal(result, 'Never')
})

test('formatRelativeTime says Just now under a minute', () => {
  const result = formatRelativeTime('2026-10-15T11:59:30Z', NOW)

  assert.equal(result, 'Just now')
})

test('formatRelativeTime counts minutes', () => {
  const result = formatRelativeTime('2026-10-15T11:55:00Z', NOW)

  assert.equal(result, '5m ago')
})

test('formatRelativeTime counts hours', () => {
  const result = formatRelativeTime('2026-10-15T09:00:00Z', NOW)

  assert.equal(result, '3h ago')
})

test('formatRelativeTime counts days across a date boundary', () => {
  const result = formatRelativeTime('2026-10-13T23:00:00Z', NOW)

  assert.equal(result, '1d ago')
})

test('formatRelativeTime follows the passed clock, not the wall clock', () => {
  const later = NOW + 10 * 60_000

  const result = formatRelativeTime('2026-10-15T11:55:00Z', later)

  assert.equal(result, '15m ago')
})
