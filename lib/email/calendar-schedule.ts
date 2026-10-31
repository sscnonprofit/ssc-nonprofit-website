const DAY = 1000 * 60 * 60 * 24

export function calendarEmailPeriod(today: string) {
  const start = new Date(`${today}T12:00:00Z`)
  const end = new Date(start.getTime() + 29 * DAY).toISOString().slice(0, 10)
  return { start: today, end, label: "Activities for the next 30 days" }
}

export function calendarEmailIsDue(
  subscription: { lastSentAt: Date | null; confirmedAt: Date | null },
  now = Date.now(),
) {
  if (!subscription.confirmedAt) return false
  const last = subscription.lastSentAt ?? subscription.confirmedAt
  return now - last.getTime() >= 30 * DAY
}
