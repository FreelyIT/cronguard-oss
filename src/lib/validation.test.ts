import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMonitorSchema, pingSchema, updateMonitorSchema } from './validation'

const ID = '00000000-0000-4000-8000-000000000000'

test('createMonitorSchema accepts a positive minute interval', () => {
  const result = createMonitorSchema.safeParse({ name: 'Backup', schedule: 'Every 5 minutes' })

  assert.equal(result.success, true)
})

test('createMonitorSchema rejects a zero minute interval', () => {
  const result = createMonitorSchema.safeParse({ name: 'Backup', schedule: 'Every 0 minutes' })

  assert.equal(result.success, false)
})

test('createMonitorSchema rejects a zero hour interval', () => {
  const result = createMonitorSchema.safeParse({ name: 'Backup', schedule: 'Every 0 hours' })

  assert.equal(result.success, false)
})

test('updateMonitorSchema rejects a zero minute interval', () => {
  const result = updateMonitorSchema.safeParse({ id: ID, schedule: 'every 00 min' })

  assert.equal(result.success, false)
})

test('createMonitorSchema accepts an interval of exactly 365 days', () => {
  const result = createMonitorSchema.safeParse({ name: 'Yearly', schedule: 'Every 8760 hours' })

  assert.equal(result.success, true)
})

test('createMonitorSchema rejects an interval longer than 365 days', () => {
  const result = createMonitorSchema.safeParse({ name: 'Huge', schedule: 'Every 9999999999 hours' })

  assert.equal(result.success, false)
})

test('updateMonitorSchema rejects an interval longer than 365 days', () => {
  const result = updateMonitorSchema.safeParse({ id: ID, schedule: 'Every 525601 minutes' })

  assert.equal(result.success, false)
})

test('pingSchema trims the message', () => {
  const result = pingSchema.parse({ message: '  backup done \n' })

  assert.equal(result.message, 'backup done')
})

test('pingSchema drops a blank message', () => {
  const result = pingSchema.parse({ message: '   ' })

  assert.equal(result.message, undefined)
})
