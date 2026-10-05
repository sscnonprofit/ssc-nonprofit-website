import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Check, Download, Mail, MapPin } from "lucide-react"

import galleryFallback from "@/content/gallery.json"
import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { getContent } from "@/lib/cms/content"
import { listPublicAlbums } from "@/lib/events/data"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const gallery = await getContent("gallery", galleryFallback)
  return {
    title: "Artists Gallery",
    description: gallery.hero.body,
  }
}

export default async function ArtistsGalleryPage() {
  const [gallery, site, albums] = await Promise.all([
    getContent("gallery", galleryFallback),
    getContent("site", siteFallback),
    listPublicAlbums(),
  ])
  const { intro, theme, guidelines, dropoff, display } = gallery

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
            <p className="mt-4 font-display text-3xl font-semibold">{intro.opening.date}</p>
            <p className="mt-1 font-display text-xl">{intro.opening.time}</p>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">{intro.opening.note}</p>
            <div className="mt-6 flex items-start gap-2 border-t border-primary-foreground/20 pt-6 text-sm text-primary-foreground/80">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {site.address.street}
                <br />
                {site.address.city}, {site.address.state} {site.address.zip}
              </span>
            </div>
          </aside>
        </div>
      </section>

      {/* Theme */}
      <section className="border-y border-border bg-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading eyebrow={theme.eyebrow} title={theme.title} intro={theme.body} />
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
          {guidelines.items.map((item) => (
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
          className="mt-8 inline-flex items-center gap-2 rounded-none bg-accent px-6 py-3 font-display text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
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
              {dropoff.dates.map((d) => (
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
            {display.items.map((item) => (
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
