"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, MailIcon } from "lucide-react"

import { subscribeToCalendarAction } from "@/app/(site)/upcoming-events/subscribe-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { calendars: { id: string; name: string }[] }

export function CalendarSubscribeForm({ calendars }: Props) {
  const [email, setEmail] = useState("")
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "")
  const [company, setCompany] = useState("")
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await subscribeToCalendarAction({ email, calendarId, categories: [], company })
      setState(result.ok ? { ok: true, message: result.message } : { ok: false, message: result.error })
    })
  }

  if (state?.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-6" role="status">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <p className="leading-relaxed text-foreground">{state.message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-xl border border-border bg-card p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="sub-email">Email address</Label>
          <Input id="sub-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 text-base" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sub-calendar">Calendar</Label>
          <select
            id="sub-calendar"
            value={calendarId}
            onChange={(event) => setCalendarId(event.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-base"
          >
            {calendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending || !calendarId} className="h-11 w-full sm:w-auto">
          <MailIcon className="size-4" />
          {pending ? "Sending…" : "Email me the calendar"}
        </Button>
        {state && !state.ok && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">Each email includes a calendar file you can open in Apple, Google, or Outlook calendar. Unsubscribe anytime.</p>
    </form>
  )
}
