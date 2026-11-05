import { z } from 'zod'
import { parseScheduleInterval } from './types'

// Schedule patterns that we support
const schedulePattern = /^(every\s+\d+\s*(min(ute)?s?|hours?)|every\s+(minute|hour|day|week)|daily|weekly)$/i

// The pattern accepts "every 0 minutes"; an interval of 0 would make a monitor late right after every ping.
function hasPositiveInterval(schedule: string): boolean {
  return parseScheduleInterval(schedule) >= 1
}
const positiveIntervalMessage = 'Schedule interval must be at least 1'

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
    .refine(hasPositiveInterval, positiveIntervalMessage),
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
    .refine(hasPositiveInterval, positiveIntervalMessage)
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
