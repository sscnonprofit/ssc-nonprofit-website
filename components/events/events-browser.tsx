"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ListIcon, MapPinIcon, SearchIcon, StarIcon } from "lucide-react"

import { EVENT_CATEGORIES, categoryLabel } from "@/lib/events/constants"
import type { PublicOccurrence } from "@/lib/events/data"
import { formatEventDate, localParts } from "@/lib/events/occurrences"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function timeLabel(item: PublicOccurrence) {
  if (item.allDay) return "All day"
  const start = new Date(item.start)
  const format = (date: Date) => formatEventDate(date, { hour: "numeric", minute: "2-digit" })
  return item.end ? `${format(start)} to ${format(new Date(item.end))}` : format(start)
}

function dayKey(iso: string) {
  const p = localParts(new Date(iso))
  return `${p.y}-${p.m}-${p.d}`
}

function EventCard({ item }: { item: PublicOccurrence }) {
  const start = new Date(item.start)
  const full = item.spotsLeft === 0
  return (
    <li>
      <Link
        href={`/upcoming-events/${item.slug}`}
        className="ssc-card group flex gap-4 p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-5 sm:p-5"
      >
        <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground sm:size-20">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">
            {formatEventDate(start, { month: "short" })}
          </span>
          <span className="font-display text-2xl font-semibold leading-none sm:text-3xl">
            {formatEventDate(start, { day: "numeric" })}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-semibold uppercase tracking-widest text-accent">{categoryLabel(item.category)}</span>
            {item.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                <StarIcon className="size-3" aria-hidden="true" />
                Featured
              </span>
            )}
            {item.recurring && <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">Repeats</span>}
          </div>
          <h3 className="text-balance font-display text-lg font-semibold leading-snug group-hover:underline">{item.title}</h3>
          <p className="text-sm text-muted-foreground">
            {formatEventDate(start, { weekday: "long" })}, {timeLabel(item)}
          </p>
          {item.location && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.location}</span>
            </p>
          )}
          {item.rsvpEnabled && (
            <p className={cn("text-sm font-medium", full ? "text-destructive" : "text-foreground")}>
              {full ? "Full" : item.spotsLeft !== null ? `${item.spotsLeft} spots left` : "RSVP open"}
            </p>
          )}
        </div>
        {item.image && (
          <div className="relative hidden aspect-square w-24 shrink-0 overflow-hidden rounded-xl sm:block">
            <Image src={item.image} alt={item.imageAlt} fill sizes="96px" className="object-cover" />
          </div>
        )}
      </Link>
    </li>
  )
}

function MonthView({ items }: { items: PublicOccurrence[] }) {
  const today = localParts(new Date())
  const [cursor, setCursor] = useState({ y: today.y, m: today.m })
  const [selected, setSelected] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, PublicOccurrence[]>()
    for (const item of items) {
      const key = dayKey(item.start)
      map.set(key, [...(map.get(key) ?? []), item])
    }
    return map
  }, [items])

  const firstWeekday = new Date(Date.UTC(cursor.y, cursor.m - 1, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(cursor.y, cursor.m - 1, 1)),
  )

  function shift(delta: number) {
    setSelected(null)
    setCursor((current) => {
      const date = new Date(Date.UTC(current.y, current.m - 1 + delta, 1))
      return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1 }
    })
  }

  const selectedItems = selected ? (byDay.get(`${cursor.y}-${cursor.m}-${selected}`) ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-secondary"
        >
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <h3 className="font-display text-lg font-semibold" aria-live="polite">
          {monthName}
        </h3>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-secondary"
        >
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} aria-hidden="true" />
          const events = byDay.get(`${cursor.y}-${cursor.m}-${day}`) ?? []
          const isToday = today.y === cursor.y && today.m === cursor.m && today.d === day
          const isSelected = selected === String(day)
          return (
            <button
              key={day}
              type="button"
              disabled={events.length === 0}
              onClick={() => setSelected(isSelected ? null : String(day))}
              aria-pressed={isSelected}
              aria-label={`${monthName.split(" ")[0]} ${day}${events.length ? `, ${events.length} ${events.length === 1 ? "event" : "events"}` : ""}`}
              className={cn(
                "relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-lg text-sm",
                events.length > 0 ? "bg-secondary font-semibold text-foreground hover:bg-accent hover:text-accent-foreground" : "text-muted-foreground",
                isToday && "ring-2 ring-primary",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {day}
              {events.length > 0 && (
                <span className="absolute bottom-1.5 flex gap-0.5" aria-hidden="true">
                  {events.slice(0, 3).map((event) => (
                    <span key={event.key + event.eventId} className="size-1 rounded-full bg-current" />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selected && (
        <ul className="flex flex-col gap-3">
          {selectedItems.map((item) => (
            <EventCard key={`${item.eventId}-${item.key}`} item={item} />
          ))}
        </ul>
      )}
      {!selected && <p className="text-center text-sm text-muted-foreground">Tap a highlighted day to see what&apos;s on.</p>}
    </div>
  )
}

export function EventsBrowser({ items }: { items: PublicOccurrence[] }) {
  const [view, setView] = useState<"list" | "month">("list")
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")

  const presentCategories = useMemo(
    () => EVENT_CATEGORIES.filter((c) => items.some((item) => item.category === c.value)),
    [items],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false
      if (!needle) return true
      return `${item.title} ${item.summary} ${item.location}`.toLowerCase().includes(needle)
    })
  }, [items, category, query])

  const groups = useMemo(() => {
    const map = new Map<string, PublicOccurrence[]>()
    for (const item of filtered) {
      const label = formatEventDate(new Date(item.start), { month: "long", year: "numeric" })
      map.set(label, [...(map.get(label) ?? []), item])
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <label className="relative flex-1">
            <span className="sr-only">Search events</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
              className="h-12 w-full rounded-full border border-input bg-background pl-10 pr-4 text-base"
            />
          </label>
          <div className="flex rounded-full border border-border p-1" role="group" aria-label="View">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              className={cn("flex size-10 items-center justify-center rounded-full", view === "list" && "bg-primary text-primary-foreground")}
            >
              <ListIcon className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              aria-pressed={view === "month"}
              aria-label="Month view"
              className={cn("flex size-10 items-center justify-center rounded-full", view === "month" && "bg-primary text-primary-foreground")}
            >
              <CalendarDaysIcon className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {presentCategories.length > 1 && (
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
            {[{ value: "all", label: "All" }, ...presentCategories].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                aria-pressed={category === option.value}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                  category === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === "month" ? (
        <MonthView items={filtered} />
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-display text-lg font-semibold">No events found</p>
          <p className="mt-1 text-muted-foreground">
            {items.length === 0 ? "New events are on the way. Check back soon." : "Try a different search or category."}
          </p>
        </div>
      ) : (
        groups.map(([label, group]) => (
          <section key={label} aria-label={label} className="flex flex-col gap-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</h3>
            <ul className="flex flex-col gap-3">
              {group.map((item) => (
                <EventCard key={`${item.eventId}-${item.key}`} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
