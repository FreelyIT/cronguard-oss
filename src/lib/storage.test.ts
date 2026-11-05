import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createMonitor,
  getAllMonitors,
  getMonitor,
  getStats,
  pauseMonitor,
  recordPing,
} from './storage'

// getDb() reads this on its first call, so the static imports above are safe.
process.env.DATABASE_PATH = ':memory:'

const HOUR_MS = 60 * 60 * 1000

function isoFromNow(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString()
}

test('a pause whose end time has passed is lifted when the monitor is read', () => {
  const { id } = createMonitor('Expired pause', 'Every hour')
  recordPing(id)
  pauseMonitor(id, 'maintenance', isoFromNow(-HOUR_MS))

  const monitor = getMonitor(id)

  assert.equal(monitor?.paused, false)
  assert.equal(monitor?.status, 'healthy')
  assert.equal(monitor?.pausedUntil, null)
  assert.equal(monitor?.pauseReason, null)
})

test('the monitor list lifts a pause whose end time has passed', () => {
  const { id } = createMonitor('Expired pause in list', 'Every hour')
  pauseMonitor(id, undefined, isoFromNow(-HOUR_MS))

  const monitor = getAllMonitors().find((m) => m.id === id)

  assert.equal(monitor?.paused, false)
})

test('a pause without an end time stays in place', () => {
  const { id } = createMonitor('Open-ended pause', 'Every hour')
  pauseMonitor(id, 'parked')

  const monitor = getMonitor(id)

  assert.equal(monitor?.status, 'paused')
})

test('a pause that ends in the future stays in place', () => {
  const { id } = createMonitor('Future pause', 'Every hour')
  pauseMonitor(id, undefined, isoFromNow(HOUR_MS))

  const monitor = getMonitor(id)

  assert.equal(monitor?.status, 'paused')
})

test('nextExpected is null before the first ping', () => {
  const { id } = createMonitor('Never pinged', 'Every hour')

  const monitor = getMonitor(id)

  assert.equal(monitor?.nextExpected, null)
})

test('nextExpected is the last ping plus the schedule interval', () => {
  const { id } = createMonitor('Pinged', 'Every 2 hours')
  recordPing(id)

  const monitor = getMonitor(id)

  const lastPing = new Date(monitor!.lastPing!).getTime()
  assert.equal(monitor?.nextExpected, new Date(lastPing + 2 * HOUR_MS).toISOString())
})

test('a monitor whose interval overflows a Date still loads after its first ping', () => {
  // Created straight through storage, as an existing database from before the schema cap may hold it.
  const { id } = createMonitor('Huge interval', 'Every 9999999999 hours')
  recordPing(id)

  const monitor = getAllMonitors().find((m) => m.id === id)

  assert.equal(monitor?.status, 'healthy')
  assert.equal(monitor?.nextExpected, null)
})

test('recordPing reports the monitor status after the ping, not before it', () => {
  const { id } = createMonitor('Down until pinged', 'Every hour')

  const result = recordPing(id)

  assert.equal(result?.monitor.status, 'healthy')
})

test('recordPing returns null for an unknown monitor', () => {
  const result = recordPing('00000000-0000-4000-8000-000000000000')

  assert.equal(result, null)
})

test('getStats counts every monitor by its current status', () => {
  const before = getStats()
  const healthy = createMonitor('Stats healthy', 'Every hour')
  recordPing(healthy.id)
  createMonitor('Stats down', 'Every hour')
  const paused = createMonitor('Stats paused', 'Every hour')
  pauseMonitor(paused.id)

  const after = getStats()

  assert.equal(after.total - before.total, 3)
  assert.equal(after.healthy - before.healthy, 1)
  assert.equal(after.down - before.down, 1)
  assert.equal(after.paused - before.paused, 1)
  assert.equal(after.totalPings - before.totalPings, 1)
})
