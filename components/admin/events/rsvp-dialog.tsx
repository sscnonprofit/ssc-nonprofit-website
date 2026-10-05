"use client"

import { useMemo, useState, useTransition } from "react"
import useSWR from "swr"
import {
  ArrowUpCircleIcon,
  CheckIcon,
  DownloadIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  addRsvpAction,
  deleteRsvpAction,
  listRsvpsAction,
  promoteRsvpAction,
  setRsvpCheckInAction,
  type RsvpList,
  type RsvpSummary,
} from "@/app/admin/event-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatEventDate } from "@/lib/events/occurrences"
import { cn } from "@/lib/utils"

type Tab = "confirmed" | "waitlist"

async function loadRsvps([, eventId]: [string, number]): Promise<RsvpList> {
  const result = await listRsvpsAction(eventId)
  if (!result.ok) throw new Error(result.error)
  return result.data ?? { rows: [], capacity: null, dates: [] }
}

function dateLabel(iso: string) {
  return formatEventDate(new Date(iso), { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export function RsvpDialog({
  event,
  canEdit,
  isAdmin,
  onClose,
  onChanged,
}: {
  event: { id: number; title: string } | null
  canEdit: boolean
  isAdmin: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const { data, error, isLoading, mutate } = useSWR(event ? ["event-rsvps", event.id] : null, loadRsvps)
  const [tab, setTab] = useState<Tab>("confirmed")
  const [dateFilter, setDateFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<RsvpSummary | null>(null)
  const [pending, startTransition] = useTransition()

  const rows = data?.rows ?? []
  const dateKeys = useMemo(() => {
    const keys = new Set(rows.map((row) => row.occurrence))
    return Array.from(keys).sort()
  }, [rows])

  const inDate = rows.filter((row) => dateFilter === "all" || row.occurrence === dateFilter)
  const confirmed = inDate.filter((row) => row.status !== "waitlist")
  const waitlist = inDate.filter((row) => row.status === "waitlist").sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const confirmedGuests = confirmed.reduce((sum, row) => sum + row.guests, 0)
  const checkedInGuests = confirmed.filter((row) => row.checkedIn).reduce((sum, row) => sum + row.guests, 0)

  const needle = query.trim().toLowerCase()
  const listed = (tab === "confirmed" ? confirmed : waitlist).filter(
    (row) => !needle || `${row.name} ${row.email} ${row.phone}`.toLowerCase().includes(needle),
  )

  function act(task: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await task()
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong")
        return
      }
      toast.success(success)
      await mutate()
      onChanged()
    })
  }

  function close() {
    setAdding(false)
    setQuery("")
    setDateFilter("all")
    setTab("confirmed")
    setConfirmRemove(null)
    onClose()
  }

  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-4 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-4 pt-4 text-left sm:px-6 sm:pt-6">
          <DialogTitle className="text-balance pr-8">Attendees: {event?.title}</DialogTitle>
          <DialogDescription>Check people in, manage the waitlist and register phone or walk-in guests.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </p>
          )}

          <dl className="grid grid-cols-3 gap-2" aria-live="polite">
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">Attending</dt>
              <dd className="mt-1 font-serif text-xl font-semibold">
                {isLoading ? "–" : confirmedGuests}
                {data?.capacity && dateFilter !== "all" ? <span className="text-sm font-normal text-muted-foreground"> / {data.capacity}</span> : null}
              </dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">Checked in</dt>
              <dd className="mt-1 font-serif text-xl font-semibold">{isLoading ? "–" : checkedInGuests}</dd>
            </div>
            <div className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">Waitlist</dt>
              <dd className="mt-1 font-serif text-xl font-semibold">{isLoading ? "–" : waitlist.length}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row">
            {dateKeys.length > 1 && (
              <select
                aria-label="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-base sm:w-56"
              >
                <option value="all">All dates</option>
                {dateKeys.map((key) => (
                  <option key={key} value={key}>
                    {dateLabel(key)}
                  </option>
                ))}
              </select>
            )}
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email or phone"
                aria-label="Search attendees"
                className="h-11 pl-9 text-base"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button variant={adding ? "secondary" : "default"} className="h-11" onClick={() => setAdding((value) => !value)}>
                {adding ? <XIcon className="size-4" /> : <UserPlusIcon className="size-4" />}
                {adding ? "Close form" : "Add attendee"}
              </Button>
            )}
            {event && rows.length > 0 && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<a href={`/api/admin/events/${event.id}/rsvps`} download />}>
                <DownloadIcon className="size-4" />
                Export CSV
              </Button>
            )}
          </div>

          {adding && event && data && (
            <AddAttendeeForm
              eventId={event.id}
              dates={data.dates}
              defaultDate={dateFilter !== "all" ? dateFilter : undefined}
              onDone={async (waitlisted) => {
                setAdding(false)
                if (waitlisted) setTab("waitlist")
                await mutate()
                onChanged()
              }}
            />
          )}

          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Attendee lists">
            {(["confirmed", "waitlist"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  "min-h-10 rounded-md text-sm font-medium text-muted-foreground transition-colors",
                  tab === value && "bg-background text-foreground shadow-sm",
                )}
              >
                {value === "confirmed" ? `Attending (${confirmed.length})` : `Waitlist (${waitlist.length})`}
              </button>
            ))}
          </div>

          <ul className="flex flex-col gap-2">
            {isLoading && <li className="py-8 text-center text-sm text-muted-foreground">Loading attendees...</li>}
            {!isLoading && listed.length === 0 && (
              <li className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                {needle ? "No one matches that search." : tab === "confirmed" ? "No one has signed up yet." : "The waitlist is empty."}
              </li>
            )}
            {listed.map((row, index) => (
              <li key={row.id} className={cn("flex items-start gap-3 rounded-lg border border-border p-3", row.checkedIn && "bg-primary/5")}>
                {tab === "confirmed" ? (
                  <button
                    type="button"
                    disabled={!canEdit || pending}
                    aria-pressed={row.checkedIn}
                    onClick={() =>
                      act(() => setRsvpCheckInAction(row.id, event!.id, !row.checkedIn), row.checkedIn ? `Undid check-in for ${row.name}` : `${row.name} checked in`)
                    }
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-60",
                      row.checkedIn ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary",
                    )}
                  >
                    <CheckIcon className="size-5" />
                    <span className="sr-only">{row.checkedIn ? `Undo check-in for ${row.name}` : `Check in ${row.name}`}</span>
                  </button>
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-semibold text-muted-foreground" aria-label={`Position ${index + 1}`}>
                    {index + 1}
                  </span>
                )}

                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-foreground">
                    {row.name}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({row.guests} {row.guests === 1 ? "guest" : "guests"})
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {row.email && (
                      <a href={`mailto:${row.email}`} className="inline-flex min-h-6 items-center gap-1 break-all text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        <MailIcon className="size-3.5 shrink-0" aria-hidden="true" />
                        {row.email}
                      </a>
                    )}
                    {row.phone && (
                      <a href={`tel:${row.phone}`} className="inline-flex min-h-6 items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        <PhoneIcon className="size-3.5 shrink-0" aria-hidden="true" />
                        {row.phone}
                      </a>
                    )}
                  </div>
                  {dateKeys.length > 1 && dateFilter === "all" && <p className="mt-1 text-xs text-muted-foreground">{dateLabel(row.occurrence)}</p>}
                  {row.note && <p className="mt-1 text-pretty rounded-md bg-muted/60 px-2 py-1 text-muted-foreground">{row.note}</p>}

                  {canEdit && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tab === "waitlist" && (
                        <Button
                          size="sm"
                          className="h-9"
                          disabled={pending}
                          onClick={() => act(() => promoteRsvpAction(row.id, event!.id), `${row.name} moved to attending`)}
                        >
                          <ArrowUpCircleIcon className="size-4" />
                          Give a spot
                        </Button>
                      )}
                      {tab === "waitlist" && isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9"
                          disabled={pending}
                          onClick={() => act(() => promoteRsvpAction(row.id, event!.id, true), `${row.name} added over capacity`)}
                        >
                          Add over capacity
                        </Button>
                      )}
                      {confirmRemove?.id === row.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-9"
                            disabled={pending}
                            onClick={() => {
                              setConfirmRemove(null)
                              act(() => deleteRsvpAction(row.id, event!.id), "Sign-up removed")
                            }}
                          >
                            Confirm remove
                          </Button>
                          <Button size="sm" variant="ghost" className="h-9" onClick={() => setConfirmRemove(null)}>
                            Keep
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-9 text-destructive" disabled={pending} onClick={() => setConfirmRemove(row)}>
                          <Trash2Icon className="size-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddAttendeeForm({
  eventId,
  dates,
  defaultDate,
  onDone,
}: {
  eventId: number
  dates: { key: string; start: string }[]
  defaultDate?: string
  onDone: (waitlisted: boolean) => void
}) {
  const upcomingDefault = dates.find((date) => new Date(date.start).getTime() >= Date.now() - 1000 * 60 * 60 * 3)?.key
  const [occurrence, setOccurrence] = useState(defaultDate ?? upcomingDefault ?? dates[0]?.key ?? "")
  const [checkIn, setCheckIn] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await addRsvpAction(eventId, {
        occurrence,
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        guests: Number(formData.get("guests") ?? 1),
        note: String(formData.get("note") ?? ""),
        checkIn,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      const waitlisted = Boolean(result.data?.waitlisted)
      toast.success(waitlisted ? "Date is full, so they were added to the waitlist" : "Attendee added")
      onDone(waitlisted)
    })
  }

  if (dates.length === 0) {
    return <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">This event has no upcoming dates to register people for.</p>
  }

  return (
    <form action={submit} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-sm font-medium">Register a phone or walk-in guest</p>
      {dates.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-rsvp-date">Date</Label>
          <select
            id="staff-rsvp-date"
            value={occurrence}
            onChange={(e) => setOccurrence(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-base"
          >
            {dates.map((date) => (
              <option key={date.key} value={date.key}>
                {dateLabel(date.start)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-rsvp-name">Name</Label>
          <Input id="staff-rsvp-name" name="name" required autoComplete="off" className="h-11 bg-background text-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-rsvp-guests">Guests, including them</Label>
          <Input id="staff-rsvp-guests" name="guests" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} className="h-11 bg-background text-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-rsvp-phone">Phone</Label>
          <Input id="staff-rsvp-phone" name="phone" type="tel" inputMode="tel" autoComplete="off" className="h-11 bg-background text-base" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="staff-rsvp-email">Email</Label>
          <Input id="staff-rsvp-email" name="email" type="email" inputMode="email" autoComplete="off" className="h-11 bg-background text-base" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="staff-rsvp-note">Note</Label>
        <Textarea id="staff-rsvp-note" name="note" rows={2} placeholder="Mobility needs, dietary notes, who they're coming with" className="bg-background text-base" />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Label htmlFor="staff-rsvp-checkin">Check them in now</Label>
        <Switch id="staff-rsvp-checkin" checked={checkIn} onCheckedChange={setCheckIn} />
      </div>
      <Button type="submit" className="h-11" disabled={pending || !occurrence}>
        {pending ? "Adding..." : "Add attendee"}
      </Button>
    </form>
  )
}
