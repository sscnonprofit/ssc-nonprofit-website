import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Download, ExternalLink } from "lucide-react"

import eventsFallback from "@/content/events.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { PageHero } from "@/components/page-hero"
import { EventsBrowser } from "@/components/events/events-browser"
import { SectionHeading } from "@/components/section-heading"
import { getContent } from "@/lib/cms/content"
import { listPublicOccurrences } from "@/lib/events/data"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const events = await getContent("events", eventsFallback)
  return {
    title: "Upcoming Events",
    description: events.hero.body,
  }
}

export default async function UpcomingEventsPage() {
  const events = await getContent("events", eventsFallback)
  const upcoming = await listPublicOccurrences({
    from: new Date(Date.now() - 1000 * 60 * 60 * 3),
    to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  })

  return (
    <>
      <PageHero
        eyebrow={events.hero.badge}
        title={events.hero.title}
        body={events.hero.body}
        image={events.hero.image}
        imageAlt={events.hero.imageAlt}
      />

      {/* Live events from the database */}
      <section id="events" aria-labelledby="events-heading" className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <div className="mb-8 flex flex-col gap-3">
          <BrandRule />
          <h2 id="events-heading" className="text-balance font-display text-3xl font-semibold sm:text-4xl">
            What&apos;s on
          </h2>
        </div>
        <EventsBrowser items={upcoming} />
      </section>

      {/* Featured event */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <BrandRule />
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              {events.featured.eyebrow}
            </p>
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{events.featured.title}</h2>
            {events.featured.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-pretty leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            <a
              href={events.featured.cta.href}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex w-fit items-center gap-2 ssc-btn-shape bg-accent px-6 py-3 font-display text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {events.featured.cta.label}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={events.featured.image}
              alt={events.featured.imageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Calendars */}
      <section className="border-y border-border bg-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={events.calendars.eyebrow}
            title={events.calendars.title}
            intro={events.calendars.body}
          />
          <Link href="/calendars" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground">
            Browse live activity calendars <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {events.calendars.items.map((c) => (
              <li key={c.title} className="ssc-card flex flex-col gap-3 p-8">
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {c.household}
                </p>
                <h3 className="font-display text-xl font-semibold">{c.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{c.description}</p>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex w-fit items-center gap-2 ssc-btn-shape border border-primary px-5 py-3 font-display text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="size-4" aria-hidden="true" />
                  View Calendar
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Artists gallery teaser */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={events.gallery.image}
              alt={events.gallery.imageAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <BrandRule />
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              {events.gallery.eyebrow}
            </p>
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{events.gallery.title}</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">{events.gallery.body}</p>
            <Link
              href={events.gallery.href}
              className="group mt-2 inline-flex w-fit items-center gap-2 ssc-btn-shape bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              See the exhibition
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Want to visit during an event?"
        body="Events are a great time to see the campus at its liveliest. Call us and we'll line up a tour around one."
      />
    </>
  )
}
