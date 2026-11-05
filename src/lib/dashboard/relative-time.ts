/** Short "x ago" label for the monitor list. `now` is passed in so renders stay pure. */
export function formatRelativeTime(dateStr: string | null, now: number): string {
  if (!dateStr) return 'Never'
  const diff = now - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
