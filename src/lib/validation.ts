import { z } from 'zod'
import { parseScheduleInterval } from './types'

// Schedule patterns that we support
const schedulePattern = /^(every\s+\d+\s*(min(ute)?s?|hours?)|every\s+(minute|hour|day|week)|daily|weekly)$/i

const MAX_INTERVAL_MINUTES = 365 * 24 * 60

// The pattern accepts any number. An interval of 0 makes a monitor late right after
// every ping; a huge one pushes the next expected ping beyond what a Date can hold.
function hasSupportedInterval(schedule: string): boolean {
  const minutes = parseScheduleInterval(schedule)
  return minutes >= 1 && minutes <= MAX_INTERVAL_MINUTES
}
const supportedIntervalMessage = 'Schedule interval must be between 1 minute and 365 days'

export const createMonitorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .trim(),
  schedule: z
    .string()
    .min(1, 'Schedule is required')
    .max(50, 'Schedule must be 50 characters or less')
    .regex(schedulePattern, 'Invalid schedule format. Examples: "Every 5 minutes", "Every hour", "Daily"')
    .refine(hasSupportedInterval, supportedIntervalMessage),
  graceMinutes: z
    .number()
    .int('Grace period must be a whole number')
    .min(1, 'Grace period must be at least 1 minute')
    .max(1440, 'Grace period must be 24 hours or less')
    .optional()
    .default(15),
})

export const updateMonitorSchema = z.object({
  id: z.string().uuid('Invalid monitor ID'),
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional(),
  schedule: z
    .string()
    .min(1, 'Schedule cannot be empty')
    .max(50, 'Schedule must be 50 characters or less')
    .regex(schedulePattern, 'Invalid schedule format')
    .refine(hasSupportedInterval, supportedIntervalMessage)
    .optional(),
  graceMinutes: z
    .number()
    .int('Grace period must be a whole number')
    .min(1, 'Grace period must be at least 1 minute')
    .max(1440, 'Grace period must be 24 hours or less')
    .optional(),
})

export const pingSchema = z.object({
  success: z.boolean().optional().default(true),
  duration: z
    .number()
    .min(0, 'Duration cannot be negative')
    .max(86400000, 'Duration cannot exceed 24 hours')
    .optional(),
  message: z
    .string()
    .trim()
    .max(500, 'Message must be 500 characters or less')
    .transform((value) => (value === '' ? undefined : value))
    .optional(),
})

// Validator for monitor ID (used in GET/DELETE)
export const monitorIdSchema = z.string().uuid('Invalid monitor ID')

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>
export type PingInput = z.infer<typeof pingSchema>
