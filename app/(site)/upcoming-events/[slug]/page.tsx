import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  AccessibilityIcon,
  ArrowLeftIcon,
  CalendarPlusIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TicketIcon,
} from "lucide-react"

import { RsvpForm } from "@/components/events/rsvp-form"
import { categoryLabel } from "@/lib/events/constants"
import { getPublicEvent } from "@/lib/events/data"
import { formatDateRange, formatEventDate } from "@/lib/events/occurrences"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicEvent(slug)
  if (!result) return { title: "Event not found" }
  const { event } = result
  return {
    title: event.title,
    description: event.summary || undefined,
    openGraph: { title: event.title, description: event.summary || undefined, images: event.image ? [event.image] : undefined },
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params
  const result = await getPublicEvent(slug)
  if (!result) notFound()
  const { event, upcoming } = result

  const cancelled = event.status === "cancelled"
  const next = upcoming[0]
  const paragraphs = event.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const canRsvp = event.rsvpEnabled && !cancelled && upcoming.length > 0

  return (
    <article className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
      <Link href="/upcoming-events" className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        All events
      </Link>

      {cancelled && (
        <p role="status" className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 font-medium text-destructive">
          This event has been cancelled.
        </p>
      )}

      {event.image && (
        <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl sm:aspect-[21/9]">
          <Image src={event.image} alt={event.imageAlt || event.title} fill priority sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{categoryLabel(event.category)}</p>
            <h1 className="text-balance font-display text-3xl font-semibold sm:text-5xl">{event.title}</h1>
            {event.summary && <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{event.summary}</p>}
          </div>

          <dl className="ssc-card flex flex-col gap-4 p-5">
            <div>
              <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">When</dt>
              <dd className="mt-1 font-medium">
                {next
                  ? formatDateRange(new Date(next.start), next.end ? new Date(next.end) : null, next.allDay)
                  : formatDateRange(event.startAt, event.endAt, event.allDay)}
              </dd>
              {event.recurrence !== "none" && <dd className="text-sm text-muted-foreground">Repeats {event.recurrence}</dd>}
            </div>
            {event.location && (
              <div>
                <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Where</dt>
                <dd className="mt-1 flex items-start gap-2 font-medium">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {event.location}
                </dd>
              </div>
            )}
            {event.cost && (
              <div>
                <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cost</dt>
                <dd className="mt-1 flex items-start gap-2 font-medium">
                  <TicketIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {event.cost}
                </dd>
              </div>
            )}
            {event.accessibility && (
              <div>
                <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accessibility</dt>
                <dd className="mt-1 flex items-start gap-2 text-pretty leading-relaxed">
                  <AccessibilityIcon className="mt-1 size-4 shrink-0" aria-hidden="true" />
                  <span className="whitespace-pre-line">{event.accessibility}</span>
                </dd>
              </div>
            )}
            {(event.contactName || event.contactPhone || event.contactEmail) && (
              <div>
                <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">Questions</dt>
                <dd className="mt-1 flex flex-col gap-1">
                  {event.contactName && <span className="font-medium">{event.contactName}</span>}
                  {event.contactPhone && (
                    <a href={`tel:${event.contactPhone}`} className="inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4">
                      <PhoneIcon className="size-4 shrink-0" aria-hidden="true" />
                      {event.contactPhone}
                    </a>
                  )}
                  {event.contactEmail && (
                    <a href={`mailto:${event.contactEmail}`} className="inline-flex min-h-11 items-center gap-2 break-all font-medium underline underline-offset-4">
                      <MailIcon className="size-4 shrink-0" aria-hidden="true" />
                      {event.contactEmail}
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-3">
            {!cancelled && (
              <a
                href={`/api/events/${event.slug}/ics${next ? `?o=${encodeURIComponent(next.key)}` : ""}`}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary px-5 py-3 font-display text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <CalendarPlusIcon className="size-4" aria-hidden="true" />
                Add to calendar
              </a>
            )}
            {event.ctaUrl && (
              <a
                href={event.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 py-3 font-display text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              >
                {event.ctaLabel || "Learn more"}
                <ExternalLinkIcon className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>

          {paragraphs.length > 0 && (
            <div className="flex flex-col gap-4">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-pretty leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {event.recurrence !== "none" && upcoming.length > 1 && (
            <section aria-labelledby="upcoming-dates" className="flex flex-col gap-3">
              <h2 id="upcoming-dates" className="font-display text-xl font-semibold">
                Upcoming dates
              </h2>
              <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
                {upcoming.slice(0, 8).map((date) => (
                  <li key={date.key} className="flex items-center justify-between gap-4 p-4">
                    <span className="font-medium">{formatEventDate(new Date(date.start), { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className="text-sm text-muted-foreground">
                      {date.allDay ? "All day" : formatEventDate(new Date(date.start), { hour: "numeric", minute: "2-digit" })}
                      {date.spotsLeft === 0 ? (event.waitlistEnabled ? " · Waitlist" : " · Full") : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {canRsvp && (
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-labelledby="rsvp-heading">
            <div className="ssc-card flex flex-col gap-4 p-5">
              <h2 id="rsvp-heading" className="font-display text-xl font-semibold">
                RSVP
              </h2>
              <RsvpForm
                eventId={event.id}
                waitlistEnabled={event.waitlistEnabled}
                dates={upcoming.map((date) => ({ key: date.key, start: date.start, allDay: date.allDay, spotsLeft: date.spotsLeft }))}
              />
            </div>
          </aside>
        )}
      </div>
    </article>
  )
}
