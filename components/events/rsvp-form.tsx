"use client"

import { useState, useTransition } from "react"
import { CheckCircle2Icon, Loader2Icon } from "lucide-react"

import { submitRsvpAction } from "@/app/(site)/upcoming-events/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatEventDate } from "@/lib/events/occurrences"

export type RsvpDate = { key: string; start: string; allDay: boolean; spotsLeft: number | null }

function dateLabel(date: RsvpDate) {
  const start = new Date(date.start)
  const day = formatEventDate(start, { weekday: "short", month: "short", day: "numeric" })
  return date.allDay ? day : `${day}, ${formatEventDate(start, { hour: "numeric", minute: "2-digit" })}`
}

export function RsvpForm({ eventId, dates, waitlistEnabled = false }: { eventId: number; dates: RsvpDate[]; waitlistEnabled?: boolean }) {
  const [occurrence, setOccurrence] = useState(dates.find((d) => d.spotsLeft !== 0)?.key ?? dates[0]?.key ?? "")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ message: string; waitlisted: boolean } | null>(null)
  const [pending, startTransition] = useTransition()

  const selected = dates.find((d) => d.key === occurrence)
  const selectedFull = selected?.spotsLeft === 0
  const allFull = dates.length > 0 && dates.every((d) => d.spotsLeft === 0)

  if (done) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-secondary p-8 text-center">
        <CheckCircle2Icon className="size-10 text-accent" aria-hidden="true" />
        <p className="font-display text-xl font-semibold">{done.waitlisted ? "You're on the waitlist" : "You're on the list"}</p>
        <p className="text-pretty text-muted-foreground">{done.message}</p>
      </div>
    )
  }

  if (allFull && !waitlistEnabled) {
    return <p className="rounded-xl bg-secondary p-4 text-pretty text-muted-foreground">Every upcoming date is full. Please check back, as spots sometimes open up.</p>
  }

  function onSubmit(formData: FormData) {
    setError(null)
    const chosen = dates.find((d) => d.key === occurrence)
    startTransition(async () => {
      const result = await submitRsvpAction({
        eventId,
        occurrence,
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        guests: Number(formData.get("guests") ?? 1),
        note: String(formData.get("note") ?? ""),
      })
      if (result.ok) {
        const when = chosen ? ` for ${dateLabel(chosen)}` : ""
        setDone(
          result.waitlisted
            ? { waitlisted: true, message: `That date is full, so we added you to the waitlist${when}. We'll be in touch if a spot opens up.` }
            : { waitlisted: false, message: `We saved your spot${when}.` },
        )
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4" noValidate>
      {dates.length > 1 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="rsvp-date">Date</Label>
          <select
            id="rsvp-date"
            value={occurrence}
            onChange={(event) => setOccurrence(event.target.value)}
            className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base"
          >
            {dates.map((date) => (
              <option key={date.key} value={date.key} disabled={date.spotsLeft === 0 && !waitlistEnabled}>
                {dateLabel(date)}
                {date.spotsLeft === 0 ? (waitlistEnabled ? " (full, join waitlist)" : " (full)") : date.spotsLeft !== null ? ` (${date.spotsLeft} left)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="rsvp-name">Name</Label>
        <Input id="rsvp-name" name="name" autoComplete="name" required className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rsvp-email">Email</Label>
        <Input id="rsvp-email" name="email" type="email" autoComplete="email" inputMode="email" required className="h-12 text-base" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rsvp-phone">Phone (optional)</Label>
          <Input id="rsvp-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rsvp-guests">Guests, including you</Label>
          <Input id="rsvp-guests" name="guests" type="number" inputMode="numeric" min={1} max={10} defaultValue={1} className="h-12 text-base" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rsvp-note">Note (optional)</Label>
        <Textarea id="rsvp-note" name="note" rows={3} placeholder="Accessibility needs, questions, anything we should know" className="text-base" />
      </div>
      {selectedFull && waitlistEnabled && (
        <p className="rounded-lg bg-secondary p-3 text-sm text-pretty text-muted-foreground">
          This date is full. Sign up below to join the waitlist and we&apos;ll contact you if a spot opens.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !occurrence}
        className="inline-flex min-h-12 items-center justify-center gap-2 ssc-btn-shape bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? "Sending" : selectedFull ? "Join the waitlist" : "Reserve my spot"}
      </button>
    </form>
  )
}
