"use client"

import { useState, useTransition } from "react"
import { BanIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { saveEventAction, setOccurrenceCancelledAction, type EventInput } from "@/app/admin/event-actions"
import { ImageField } from "@/components/admin/image-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/builder/schema"
import { EVENT_CATEGORIES } from "@/lib/events/constants"
import type { AdminEventDetail } from "@/lib/events/data"
import { RECURRENCE_OPTIONS, formatEventDate } from "@/lib/events/occurrences"

type FormState = Omit<EventInput, "id">

function blankForm(): FormState {
  const next = new Date()
  next.setDate(next.getDate() + 7)
  const pad = (n: number) => String(n).padStart(2, "0")
  const day = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
  return {
    title: "",
    slug: "",
    summary: "",
    description: "",
    category: "community",
    location: "",
    startAt: `${day}T10:00`,
    endAt: `${day}T11:00`,
    allDay: false,
    image: null,
    imageAlt: "",
    ctaLabel: "",
    ctaUrl: "",
    featured: false,
    status: "draft",
    capacity: "",
    rsvpEnabled: false,
    recurrence: "none",
    recurrenceUntil: "",
    cost: "",
    accessibility: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    waitlistEnabled: false,
  }
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ToggleRow({ id, label, hint, checked, onChange, disabled }: { id: string; label: string; hint?: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export function EventFormSheet({
  open,
  onOpenChange,
  eventId,
  detail,
  role,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: number | null
  detail: AdminEventDetail | null
  role: string
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(blankForm)
  const [slugTouched, setSlugTouched] = useState(false)
  const [dates, setDates] = useState<AdminEventDetail["dates"]>([])
  const [pending, startTransition] = useTransition()
  const isAdmin = role === "admin"

  // Load once per opening; later refreshes of `detail` must not wipe unsaved edits.
  const loadKey = open ? String(eventId ?? "new") : null
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  if (loadKey !== loadedKey) {
    setLoadedKey(loadKey)
    if (loadKey) {
      setForm(detail ? detail.form : blankForm())
      setDates(detail ? detail.dates : [])
      setSlugTouched(Boolean(detail))
    }
  }

  function patch(values: Partial<FormState>) {
    setForm((current) => ({ ...current, ...values }))
  }

  function setTitle(title: string) {
    patch(slugTouched ? { title } : { title, slug: slugify(title) })
  }

  function setDay(field: "startAt" | "endAt" | "recurrenceUntil", value: string) {
    if (!value) return patch({ [field]: "" })
    patch({ [field]: value.includes("T") ? value : `${value}T${form.allDay ? "00:00" : (form[field].slice(11) || "10:00")}` })
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const result = await saveEventAction({ ...form, id: eventId ?? undefined })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(eventId ? "Event saved" : "Event created")
      onOpenChange(false)
      onSaved()
    })
  }

  function toggleDate(key: string, cancelled: boolean) {
    if (!eventId) return
    startTransition(async () => {
      const result = await setOccurrenceCancelledAction(eventId, key, cancelled)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setDates((current) => current.map((item) => (item.key === key ? { ...item, cancelled } : item)))
      toast.success(cancelled ? "That date is cancelled" : "That date is back on")
      onSaved()
    })
  }

  const dateInputType = form.allDay ? "date" : "datetime-local"
  const dateValue = (value: string) => (form.allDay ? value.slice(0, 10) : value)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border p-4 text-left">
          <SheetTitle>{eventId ? "Edit event" : "New event"}</SheetTitle>
          <SheetDescription>Details marked as a draft stay hidden from the public calendar.</SheetDescription>
        </SheetHeader>

        <form id="event-form" onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
          <Field id="event-title" label="Title">
            <Input id="event-title" value={form.title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} className="h-11 text-base" />
          </Field>

          <Field id="event-summary" label="Short summary" hint="Shown on event cards. Keep it to a sentence or two.">
            <Textarea id="event-summary" value={form.summary} onChange={(e) => patch({ summary: e.target.value })} rows={2} maxLength={300} className="text-base" />
          </Field>

          <Field id="event-description" label="Full description" hint="Blank lines start a new paragraph.">
            <Textarea id="event-description" value={form.description} onChange={(e) => patch({ description: e.target.value })} rows={6} className="text-base" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="event-category" label="Category">
              <Select value={form.category} onValueChange={(value) => patch({ category: value ?? "community" })}>
                <SelectTrigger id="event-category" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="event-location" label="Location">
              <Input id="event-location" value={form.location} onChange={(e) => patch({ location: e.target.value })} maxLength={200} className="h-11 text-base" />
            </Field>
          </div>

          <ToggleRow id="event-allday" label="All-day event" checked={form.allDay} onChange={(allDay) => patch({ allDay, startAt: form.startAt.slice(0, 10) + (allDay ? "T00:00" : "T10:00"), endAt: form.endAt ? form.endAt.slice(0, 10) + (allDay ? "T00:00" : "T11:00") : "" })} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="event-start" label="Starts">
              <Input id="event-start" type={dateInputType} value={dateValue(form.startAt)} onChange={(e) => setDay("startAt", e.target.value)} required className="h-11 text-base" />
            </Field>
            <Field id="event-end" label="Ends (optional)">
              <Input id="event-end" type={dateInputType} value={dateValue(form.endAt)} onChange={(e) => setDay("endAt", e.target.value)} className="h-11 text-base" />
            </Field>
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">Times are in Central Time, the same as the campus.</p>

          <section className="flex flex-col gap-4 rounded-lg border border-border p-3" aria-label="Repeat">
            <Field id="event-repeat" label="Repeat">
              <Select value={form.recurrence} onValueChange={(value) => patch({ recurrence: value ?? "none" })}>
                <SelectTrigger id="event-repeat" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.recurrence !== "none" && (
              <Field id="event-until" label="Repeat until" hint="Leave blank to keep repeating.">
                <Input id="event-until" type="date" value={form.recurrenceUntil.slice(0, 10)} onChange={(e) => patch({ recurrenceUntil: e.target.value ? `${e.target.value}T23:59` : "" })} className="h-11 text-base" />
              </Field>
            )}
            {eventId && dates.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Upcoming dates</p>
                <ul className="flex flex-col gap-1.5">
                  {dates.map((date) => (
                    <li key={date.key} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                      <span className={date.cancelled ? "text-muted-foreground line-through" : ""}>
                        {formatEventDate(new Date(date.start), { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <Button type="button" variant="ghost" size="sm" className="h-9" disabled={pending} onClick={() => toggleDate(date.key, !date.cancelled)}>
                        {date.cancelled ? <RotateCcwIcon className="size-3.5" /> : <BanIcon className="size-3.5" />}
                        {date.cancelled ? "Restore" : "Cancel this date"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-border p-3" aria-labelledby="visitor-info-heading">
            <div>
              <h3 id="visitor-info-heading" className="text-sm font-medium">Visitor information</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Helps residents and families decide if the event works for them.</p>
            </div>
            <Field id="event-cost" label="Cost" hint={'For example "Free", "$5 suggested donation" or "$12 per person".'}>
              <Input id="event-cost" value={form.cost} onChange={(e) => patch({ cost: e.target.value })} maxLength={80} placeholder="Free" className="h-11 text-base" />
            </Field>
            <Field id="event-access" label="Accessibility" hint="Wheelchair access, seating, hearing loop, transportation, large-print materials.">
              <Textarea
                id="event-access"
                value={form.accessibility}
                onChange={(e) => patch({ accessibility: e.target.value })}
                rows={3}
                maxLength={1000}
                placeholder="Wheelchair accessible. Seating provided. Shuttle leaves the main entrance at 9:45."
                className="text-base"
              />
            </Field>
          </section>

          <section className="flex flex-col gap-4 rounded-lg border border-border p-3" aria-labelledby="contact-heading">
            <div>
              <h3 id="contact-heading" className="text-sm font-medium">Event contact</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Shown on the event page for questions and phone sign-ups.</p>
            </div>
            <Field id="event-contact-name" label="Name">
              <Input id="event-contact-name" value={form.contactName} onChange={(e) => patch({ contactName: e.target.value })} maxLength={120} autoComplete="off" className="h-11 text-base" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="event-contact-phone" label="Phone">
                <Input id="event-contact-phone" type="tel" inputMode="tel" value={form.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} maxLength={40} autoComplete="off" className="h-11 text-base" />
              </Field>
              <Field id="event-contact-email" label="Email">
                <Input id="event-contact-email" type="email" inputMode="email" value={form.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} maxLength={200} autoComplete="off" className="h-11 text-base" />
              </Field>
            </div>
          </section>

          <ImageField label="Event image" value={form.image ?? ""} onChange={(url) => patch({ image: url || null })} aspect={16 / 9} />
          {form.image && (
            <Field id="event-alt" label="Image description" hint="Read aloud by screen readers.">
              <Input id="event-alt" value={form.imageAlt} onChange={(e) => patch({ imageAlt: e.target.value })} maxLength={200} className="h-11 text-base" />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="event-cta-label" label="Button label">
              <Input id="event-cta-label" value={form.ctaLabel} onChange={(e) => patch({ ctaLabel: e.target.value })} placeholder="Buy tickets" maxLength={60} className="h-11 text-base" />
            </Field>
            <Field id="event-cta-url" label="Button link">
              <Input id="event-cta-url" value={form.ctaUrl} onChange={(e) => patch({ ctaUrl: e.target.value })} placeholder="https://" inputMode="url" className="h-11 text-base" />
            </Field>
          </div>

          <section className="flex flex-col gap-3" aria-label="Sign-ups">
            <ToggleRow id="event-rsvp" label="Collect RSVPs" hint="Adds a sign-up form to the event page." checked={form.rsvpEnabled} onChange={(rsvpEnabled) => patch({ rsvpEnabled })} />
            {form.rsvpEnabled && (
              <Field id="event-capacity" label="Spots per date" hint="Leave blank for no limit.">
                <Input id="event-capacity" type="number" inputMode="numeric" min={1} max={5000} value={form.capacity} onChange={(e) => patch({ capacity: e.target.value })} className="h-11 text-base" />
              </Field>
            )}
            {form.rsvpEnabled && form.capacity.trim() !== "" && (
              <ToggleRow
                id="event-waitlist"
                label="Keep a waitlist when full"
                hint="People can still sign up once spots run out. You choose who gets a freed spot."
                checked={form.waitlistEnabled}
                onChange={(waitlistEnabled) => patch({ waitlistEnabled })}
              />
            )}
            <ToggleRow id="event-featured" label="Feature this event" hint="Pins it to the top of the events page." checked={form.featured} onChange={(featured) => patch({ featured })} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="event-status" label="Status" hint={isAdmin ? undefined : "An admin publishes events."}>
              <Select value={form.status} onValueChange={(value) => patch({ status: value ?? "draft" })} disabled={!isAdmin}>
                <SelectTrigger id="event-status" className="h-11 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field id="event-slug" label="Web address" hint={`/upcoming-events/${form.slug || "..."}`}>
              <Input id="event-slug" value={form.slug} onChange={(e) => { setSlugTouched(true); patch({ slug: slugify(e.target.value) }) }} className="h-11 text-base" />
            </Field>
          </div>
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="submit" form="event-form" className="h-11" disabled={pending}>
            {pending ? "Saving..." : eventId ? "Save changes" : "Create event"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
