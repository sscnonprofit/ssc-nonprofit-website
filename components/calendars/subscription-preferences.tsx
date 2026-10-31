"use client"

import { useState, useTransition } from "react"

import { unsubscribeAction, updateSubscriptionAction } from "@/app/(site)/upcoming-events/subscribe-actions"
import { Button } from "@/components/ui/button"
import { CATEGORIES } from "@/lib/calendars/model"

type Props = {
  token: string
  calendarName: string
  initialCategories: string[]
  unsubscribed: boolean
}

export function SubscriptionPreferences({ token, calendarName, initialCategories, unsubscribed }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [gone, setGone] = useState(unsubscribed)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggle(category: string) {
    setCategories((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]))
  }

  function save() {
    startTransition(async () => {
      const result = await updateSubscriptionAction({ token, categories })
      setMessage(result.ok ? result.message : result.error)
    })
  }

  function leave() {
    startTransition(async () => {
      const result = await unsubscribeAction(token)
      if (result.ok) setGone(true)
      setMessage(result.ok ? result.message : result.error)
    })
  }

  if (gone) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 leading-relaxed" role="status">
        You&apos;re unsubscribed from <strong>{calendarName}</strong>. You can sign up again any time from the events page.
      </p>
    )
  }

  return (
    <div className="grid gap-6 rounded-xl border border-border bg-card p-6">
      <p className="text-sm leading-relaxed text-muted-foreground">Calendar emails are sent every 30 days.</p>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Activity types (none selected means everything)</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const active = categories.includes(category)
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(category)}
                className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"}`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={save} disabled={pending} className="h-11">
          Save preferences
        </Button>
        <Button variant="outline" onClick={leave} disabled={pending} className="h-11">
          Unsubscribe
        </Button>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
