"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BanIcon,
  RotateCcwIcon,
  CalendarPlusIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  PencilIcon,
  RepeatIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteEventAction,
  duplicateEventAction,
  setEventStatusAction,
  toggleFeaturedAction,
} from "@/app/admin/event-actions"
import { EventFormSheet } from "@/components/admin/events/event-form-sheet"
import { RsvpDialog } from "@/components/admin/events/rsvp-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { categoryLabel } from "@/lib/events/constants"
import type { AdminEvent, AdminEventDetail } from "@/lib/events/data"
import { formatEventDate } from "@/lib/events/occurrences"
import { cn } from "@/lib/utils"

const FILTERS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past", label: "Past" },
] as const

type Filter = (typeof FILTERS)[number]["value"]

const STATUS_STYLES: Record<string, string> = {
  published: "bg-primary/15 text-primary",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/15 text-destructive",
}

export function EventsManager({
  events,
  details,
  role,
}: {
  events: AdminEvent[]
  details: Record<number, AdminEventDetail>
  role: string
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [rsvpFor, setRsvpFor] = useState<{ id: number; title: string } | null>(null)
  const [deleting, setDeleting] = useState<AdminEvent | null>(null)
  const [cancelling, setCancelling] = useState<AdminEvent | null>(null)
  const [pending, startTransition] = useTransition()
  const canEdit = role === "admin" || role === "editor"
  const isAdmin = role === "admin"

  const visible = useMemo(() => {
    const now = Date.now()
    const needle = query.trim().toLowerCase()
    return events
      .filter((event) => {
        if (needle && !`${event.title} ${event.location}`.toLowerCase().includes(needle)) return false
        const upcoming = event.nextStart !== null && new Date(event.nextStart).getTime() >= now - 1000 * 60 * 60 * 3
        if (filter === "upcoming") return upcoming && event.status !== "cancelled"
        if (filter === "past") return !upcoming
        if (filter === "published") return event.status === "published"
        if (filter === "draft") return event.status === "draft"
        if (filter === "cancelled") return event.status === "cancelled"
        return true
      })
      .sort((a, b) => {
        const aDate = new Date(a.nextStart ?? a.startAt).getTime()
        const bDate = new Date(b.nextStart ?? b.startAt).getTime()
        const aFuture = a.nextStart !== null
        const bFuture = b.nextStart !== null
        if (aFuture !== bFuture) return aFuture ? -1 : 1
        return aFuture ? aDate - bDate : bDate - aDate
      })
  }, [events, filter, query])

  const summary = useMemo(() => {
    const now = Date.now()
    const monthAhead = now + 1000 * 60 * 60 * 24 * 30
    const upcoming = events.filter(
      (event) => event.status === "published" && event.nextStart !== null && new Date(event.nextStart).getTime() <= monthAhead,
    )
    return {
      nextMonth: upcoming.length,
      guests: events.filter((event) => event.nextStart !== null).reduce((sum, event) => sum + event.rsvpGuests, 0),
      waitlist: events.reduce((sum, event) => sum + event.waitlistCount, 0),
      drafts: events.filter((event) => event.status === "draft").length,
    }
  }, [events])

  function run(task: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await task()
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong")
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  function openEditor(id: number | null) {
    setEditingId(id)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Events at a glance">
        {[
          { label: "Live in next 30 days", value: summary.nextMonth, filterTo: "upcoming" as Filter },
          { label: "Guests signed up", value: summary.guests, filterTo: "upcoming" as Filter },
          { label: "On waitlists", value: summary.waitlist, filterTo: "upcoming" as Filter },
          { label: "Drafts to review", value: summary.drafts, filterTo: "draft" as Filter },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setFilter(item.filterTo)}
            className="flex min-h-11 flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="font-serif text-2xl font-semibold leading-none text-foreground">{item.value}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events"
            aria-label="Search events"
            className="h-11 pl-9 text-base"
          />
        </div>
        {canEdit && (
          <Button className="h-11" onClick={() => openEditor(null)}>
            <CalendarPlusIcon className="size-4" />
            New event
          </Button>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter events">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={filter === item.value}
            onClick={() => setFilter(item.value)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
              filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">{events.length === 0 ? "No events yet" : "No events match"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length === 0 ? "Create your first event to start filling the public calendar." : "Try a different search or filter."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((event) => {
            const shown = new Date(event.nextStart ?? event.startAt)
            return (
              <li key={event.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-muted py-2 text-center" aria-hidden="true">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatEventDate(shown, { month: "short" })}
                  </span>
                  <span className="font-serif text-2xl font-semibold leading-none text-foreground">
                    {formatEventDate(shown, { day: "numeric" })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => openEditor(event.id)}
                    className="block min-h-6 max-w-full text-left font-medium text-foreground hover:underline"
                    disabled={!canEdit}
                  >
                    <span className="line-clamp-2 text-pretty">{event.title}</span>
                  </button>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {event.nextStart
                      ? formatEventDate(shown, event.allDay ? { weekday: "short", month: "short", day: "numeric" } : { weekday: "short", hour: "numeric", minute: "2-digit" })
                      : "Ended"}
                    {event.location && ` · ${event.location}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className={cn("capitalize", STATUS_STYLES[event.status])}>
                      {event.status}
                    </Badge>
                    <Badge variant="outline">{categoryLabel(event.category)}</Badge>
                    {event.recurrence !== "none" && (
                      <Badge variant="outline" className="gap-1">
                        <RepeatIcon className="size-3" aria-hidden="true" />
                        Repeats
                      </Badge>
                    )}
                    {event.featured && (
                      <Badge variant="outline" className="gap-1">
                        <StarIcon className="size-3" aria-hidden="true" />
                        Featured
                      </Badge>
                    )}
                    {event.rsvpEnabled && (
                      <button
                        type="button"
                        onClick={() => setRsvpFor({ id: event.id, title: event.title })}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <UsersIcon className="size-3" aria-hidden="true" />
                        {event.rsvpGuests}
                        {event.capacity && event.recurrence === "none" ? ` / ${event.capacity}` : ""} attending
                        {event.checkedInGuests > 0 && ` · ${event.checkedInGuests} in`}
                      </button>
                    )}
                    {event.waitlistCount > 0 && (
                      <Badge variant="outline" className="border-accent/50 text-foreground">
                        {event.waitlistCount} waitlisted
                      </Badge>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-11 shrink-0" disabled={pending} />}
                  >
                    <MoreVerticalIcon className="size-4" />
                    <span className="sr-only">Actions for {event.title}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {canEdit && (
                      <DropdownMenuItem className="min-h-11" onClick={() => openEditor(event.id)}>
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {event.status !== "draft" && (
                      <DropdownMenuItem
                        className="min-h-11"
                        render={<Link href={`/upcoming-events/${event.slug}`} target="_blank" />}
                      >
                        <ExternalLinkIcon className="size-4" />
                        View on site
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="min-h-11" onClick={() => setRsvpFor({ id: event.id, title: event.title })}>
                      <UsersIcon className="size-4" />
                      View RSVPs
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuItem className="min-h-11" onClick={() => run(() => duplicateEventAction(event.id), "Duplicated as a draft")}>
                          <CopyIcon className="size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="min-h-11" onClick={() => run(() => toggleFeaturedAction(event.id, !event.featured), event.featured ? "Removed from featured" : "Marked as featured")}>
                          <StarIcon className="size-4" />
                          {event.featured ? "Remove featured" : "Feature"}
                        </DropdownMenuItem>
                      </>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem
                        className="min-h-11"
                        onClick={() =>
                          run(
                            () => setEventStatusAction(event.id, event.status === "published" ? "draft" : "published"),
                            event.status === "published" ? "Event unpublished" : "Event published",
                          )
                        }
                      >
                        {event.status === "published" ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                        {event.status === "published" ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                    )}
                    {isAdmin && event.status !== "draft" && (
                      <DropdownMenuItem
                        className="min-h-11"
                        onClick={() =>
                          event.status === "cancelled"
                            ? run(() => setEventStatusAction(event.id, "published"), "Event restored")
                            : setCancelling(event)
                        }
                      >
                        {event.status === "cancelled" ? <RotateCcwIcon className="size-4" /> : <BanIcon className="size-4" />}
                        {event.status === "cancelled" ? "Restore event" : "Cancel event"}
                      </DropdownMenuItem>
                    )}
                    {canEdit && (isAdmin || event.status === "draft") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" className="min-h-11" onClick={() => setDeleting(event)}>
                          <Trash2Icon className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )
          })}
        </ul>
      )}

      <EventFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        eventId={editingId}
        detail={editingId ? (details[editingId] ?? null) : null}
        role={role}
        onSaved={() => router.refresh()}
      />

      <RsvpDialog event={rsvpFor} canEdit={canEdit} isAdmin={isAdmin} onClose={() => setRsvpFor(null)} onChanged={() => router.refresh()} />

      <Dialog open={Boolean(cancelling)} onOpenChange={(open) => !open && setCancelling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this event?</DialogTitle>
            <DialogDescription>
              {cancelling?.title} will leave the public calendar and its page will show a cancellation notice.
              {cancelling && cancelling.rsvpCount > 0
                ? ` ${cancelling.rsvpCount} ${cancelling.rsvpCount === 1 ? "person has" : "people have"} signed up, so export the attendee list to let them know.`
                : ""}{" "}
              You can restore it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            {cancelling && cancelling.rsvpCount > 0 && (
              <Button variant="outline" className="h-11" nativeButton={false} render={<a href={`/api/admin/events/${cancelling.id}/rsvps`} download />}>
                Export attendees
              </Button>
            )}
            <Button
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() => {
                const target = cancelling
                setCancelling(null)
                if (target) run(() => setEventStatusAction(target.id, "cancelled"), "Event cancelled")
              }}
            >
              Cancel event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              {deleting?.title} and all of its RSVPs will be removed for good. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setDeleting(null)}>
              Keep event
            </Button>
            <Button
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() => {
                const target = deleting
                setDeleting(null)
                if (target) run(() => deleteEventAction(target.id), "Event deleted")
              }}
            >
              Delete event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
