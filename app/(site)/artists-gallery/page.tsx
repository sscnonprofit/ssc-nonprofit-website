import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Check, Download, Mail, MapPin } from "lucide-react"

import galleryFallback from "@/content/gallery.json"
import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { getContent } from "@/lib/cms/content"
import { getArtShowSchedule, listPublicAlbums } from "@/lib/events/data"
import { formatEventDate } from "@/lib/events/occurrences"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const gallery = await getContent("gallery", galleryFallback)
  return {
    title: "Artists Gallery",
    description: gallery.hero.body,
  }
}

function formatDay(date: Date) {
  return formatEventDate(date, { weekday: "long", month: "long", day: "numeric" })
}

function formatClockTime(date: Date) {
  return formatEventDate(date, { hour: "numeric", minute: "2-digit" })
}

function formatTimeRange(start: Date, end: Date | null) {
  return end ? `${formatClockTime(start)} – ${formatClockTime(end)}` : formatClockTime(start)
}

function formatMonthYear(date: Date) {
  return formatEventDate(date, { month: "long", year: "numeric" })
}

export default async function ArtistsGalleryPage() {
  const [gallery, site, albums, schedule] = await Promise.all([
    getContent("gallery", galleryFallback),
    getContent("site", siteFallback),
    listPublicAlbums(),
    getArtShowSchedule(),
  ])
  const { intro, theme, guidelines, dropoff, display } = gallery

  // Every schedule-dependent value below prefers the live Event from
  // /admin/events (matched by slug) and falls back to the CMS copy only when
  // no corresponding event has been scheduled yet.
  const openingDate = schedule.opening ? formatDay(schedule.opening.startAt) : intro.opening.date
  const openingTime = schedule.opening
    ? formatTimeRange(schedule.opening.startAt, schedule.opening.endAt)
    : intro.opening.time
  const openingNote = schedule.opening?.summary || intro.opening.note
  const openingLocation = schedule.opening?.location || null

  // Older published content stored the deadline as a plain bullet instead of
  // a dedicated fallback field — support both shapes so a previously
  // published page never breaks while content catches up.
  const fallbackDeadlineLine: string | undefined =
    guidelines.deadlineFallback ?? guidelines.items.find((item: string) => /no later than/i.test(item))
  const deadlineDate = schedule.deadline
    ? formatEventDate(schedule.deadline.startAt, { month: "long", day: "numeric", year: "numeric" })
    : (fallbackDeadlineLine?.match(/\b[A-Za-z]+ \d{1,2},? \d{4}\b/)?.[0] ?? null)
  const deadlineSentence = schedule.deadline
    ? `Please submit your original artwork no later than ${deadlineDate}.`
    : (fallbackDeadlineLine ?? "Submission deadline to be announced.")
  const baseGuidelineItems = guidelines.items.filter((item: string) => !/no later than/i.test(item))
  const guidelineItems = [baseGuidelineItems[0], deadlineSentence, ...baseGuidelineItems.slice(1)]

  const dropoffDates =
    schedule.dropoffs.length > 0
      ? schedule.dropoffs.map((event) => ({
          day: formatDay(event.startAt),
          time: formatTimeRange(event.startAt, event.endAt),
        }))
      : dropoff.dates

  const displayPeriod = schedule.display
    ? `${formatMonthYear(schedule.display.startAt)} – ${schedule.display.endAt ? formatMonthYear(schedule.display.endAt) : "Ongoing"}`
    : null
  const displayLocation = schedule.display?.location || null
  const displayItems = display.items.map((item: { label: string; value: string }) => {
    if (item.label === "Display period" && displayPeriod) return { ...item, value: displayPeriod }
    if (item.label === "Location" && displayLocation) return { ...item, value: displayLocation }
    return item
  })

  const displayPeriodValue = displayItems.find((item: { label: string }) => item.label === "Display period")?.value ?? null
  const keyDates = [
    { label: "Submission deadline", value: deadlineDate },
    { label: "Opening reception", value: `${openingDate} · ${openingTime}` },
    { label: "On display", value: displayPeriodValue },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  return (
    <>
      <PageHero
        eyebrow={gallery.hero.badge}
        title={gallery.hero.title}
        body={gallery.hero.body}
        image={gallery.hero.image}
        imageAlt={gallery.hero.imageAlt}
      />

      {albums.length > 0 && (
        <section id="albums" aria-labelledby="albums-heading" className="mx-auto max-w-7xl px-6 pt-16 sm:pt-24">
          <div className="mb-8 flex flex-col gap-3">
            <BrandRule />
            <h2 id="albums-heading" className="text-balance font-display text-3xl font-semibold sm:text-4xl">
              Photo albums
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {albums.map((album, index) => (
              <li key={album.id} className={album.featured && index === 0 ? "col-span-2 lg:col-span-1" : undefined}>
                <Link href={`/artists-gallery/${album.slug}`} className="ssc-card group flex h-full flex-col overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    {album.cover && (
                      <Image
                        src={album.cover}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 24rem, 50vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-4">
                    <h3 className="text-balance font-display text-base font-semibold leading-snug sm:text-lg">{album.title}</h3>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Invitation + opening card */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="flex flex-col gap-5">
            <BrandRule />
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{intro.eyebrow}</p>
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{intro.title}</h2>
            {intro.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-pretty leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>

          <aside className="rounded-3xl bg-primary p-8 text-primary-foreground">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
              {intro.opening.label}
            </p>
            <p className="mt-4 font-display text-3xl font-semibold">{openingDate}</p>
            <p className="mt-1 font-display text-xl">{openingTime}</p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">{openingNote}</p>
            <div className="mt-6 flex items-start gap-2 border-t border-primary-foreground/20 pt-6 text-sm text-primary-foreground/80">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {openingLocation ? (
                <span>{openingLocation}</span>
              ) : (
                <span>
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.state} {site.address.zip}
                </span>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Theme */}
      <section className="border-y border-border bg-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={theme.eyebrow} title={theme.title} intro={theme.body} />
          {keyDates.length > 0 && (
            <dl className="mt-10 grid gap-4 sm:grid-cols-3">
              {keyDates.map((item) => (
                <div key={item.label} className="ssc-card flex items-start gap-3 p-5">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-display text-base font-semibold leading-snug">{item.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="ssc-card p-8">
              <h3 className="font-display text-xl font-semibold">{theme.inspirationTitle}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {theme.inspiration.map((item) => (
                  <li key={item} className="flex items-start gap-3 leading-relaxed text-muted-foreground">
                    <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ssc-card p-8">
              <h3 className="font-display text-xl font-semibold">{theme.examplesTitle}</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {theme.examples.map((item) => (
                  <li key={item} className="flex items-start gap-3 leading-relaxed text-muted-foreground">
                    <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <SectionHeading eyebrow={guidelines.eyebrow} title={guidelines.title} />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {guidelineItems.map((item) => (
            <li
              key={item}
              className="ssc-card flex items-start gap-3 p-6 leading-relaxed"
            >
              <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <a
          href={guidelines.agreement.href}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 ssc-btn-shape bg-accent px-6 py-3 font-display text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Download className="size-4" aria-hidden="true" />
          {guidelines.agreement.label}
        </a>
      </section>

      {/* Drop-off */}
      <section className="border-y border-border bg-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={dropoff.eyebrow} title={dropoff.title} intro={dropoff.body} />
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <ul className="flex flex-col gap-3">
              {dropoffDates.map((d: { day: string; time: string }) => (
                <li
                  key={d.day}
                  className="ssc-card flex flex-col gap-1 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-display font-semibold">{d.day}</span>
                  <span className="font-mono text-sm text-muted-foreground">{d.time}</span>
                </li>
              ))}
            </ul>
            <div className="ssc-card flex flex-col gap-6 p-8">
              <div>
                <h3 className="font-display text-xl font-semibold">Three ways to submit</h3>
                <ol className="mt-5 flex flex-col gap-3">
                  {dropoff.options.map((o, i) => (
                    <li key={o} className="flex items-start gap-3 leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-accent-foreground">
                        {i + 1}
                      </span>
                      {o}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="border-t border-border pt-6">
                <p className="font-display font-semibold">{dropoff.contact.name}</p>
                <p className="text-sm text-muted-foreground">{dropoff.contact.role}</p>
                <a
                  href={`mailto:${dropoff.contact.email}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline decoration-accent decoration-2 underline-offset-4"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {dropoff.contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Display details */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-24">
        <div className="grid gap-10 rounded-3xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <BrandRule />
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">{display.eyebrow}</p>
            <h2 className="text-balance font-display text-3xl font-semibold">{display.title}</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">{display.body}</p>
          </div>
          <dl className="flex flex-col gap-6">
            {displayItems.map((item: { label: string; value: string }) => (
              <div key={item.label} className="border-l-2 border-accent pl-5">
                <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 font-display text-xl font-semibold">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <CtaBand
        title="Questions about submitting?"
        body="Melissa is happy to talk through your piece, the theme, or drop-off logistics."
      />
    </>
  )
}
