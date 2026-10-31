import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, CalendarDays } from "lucide-react"

import homeFallback from "@/content/home.json"
import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { SectionHeading } from "@/components/section-heading"
import { StatCounter } from "@/components/stat-counter"
import { Testimonials } from "@/components/testimonials"
import { getContent } from "@/lib/cms/content"

export async function generateMetadata(): Promise<Metadata> {
  const home = await getContent("home", homeFallback)
  return {
    title: home.seo.title,
    description: home.seo.description,
    alternates: { canonical: "/" },
  }
}

export default async function HomePage() {
  const [home, site] = await Promise.all([
    getContent("home", homeFallback),
    getContent("site", siteFallback),
  ])

  const heroSentences = home.hero.body.split(/(?<=[.!?])\s+/)
  const heroLead = heroSentences.slice(0, 2).join(" ")
  const heroMore = heroSentences.slice(2).join(" ")

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <Image
          src={home.hero.image}
          alt={home.hero.imageAlt}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary/93 to-primary/60"
          aria-hidden="true"
        />
        {/* Signature glow, echoing the accent blur used on the closing CTA band. */}


        <div className="mx-auto max-w-7xl px-6 pb-24 pt-12 sm:pb-32 sm:pt-24 lg:pt-28">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-1.5 backdrop-blur-sm">
                <CalendarDays className="size-3.5 text-accent" aria-hidden="true" />
                <span className="font-display text-xs font-semibold uppercase tracking-[0.14em]">
                  Est. {site.founded}
                </span>
              </span>
              <span className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/65">
                Sheboygan County&apos;s Only Nonprofit Senior Care
              </span>
            </div>

            <BrandRule className="mt-6 w-24" />
            <h1 className="ssc-h1 mt-6 text-balance">{home.hero.title}</h1>
            <p className="mt-6 max-w-xl text-pretty leading-relaxed text-primary-foreground/85">{heroLead}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/donate"
                className="group inline-flex items-center gap-2 ssc-btn-shape bg-accent px-7 py-3.5 font-display font-semibold text-accent-foreground shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25"
              >
                Donate Now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center ssc-btn-shape border border-primary-foreground/35 px-7 py-3.5 font-display font-semibold backdrop-blur-sm transition-colors hover:bg-primary-foreground/10"
              >
                Schedule A Visit
              </Link>
            </div>

            {heroMore && (
              <details className="mt-5 max-w-xl">
                <summary className="min-h-11 cursor-pointer py-2 font-display text-sm font-semibold text-primary-foreground underline underline-offset-4">
                  More about our community
                </summary>
                <p className="mt-3 text-pretty leading-relaxed text-primary-foreground/85">{heroMore}</p>
              </details>
            )}

            <ul className="mt-5 flex flex-wrap gap-3 text-sm">
              <li className="inline-flex items-center gap-2.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Award className="size-3.5 text-accent" aria-hidden="true" />
                </span>
                U.S. News &amp; World Report &ldquo;Best Nursing Home&rdquo;
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats: an elevated panel that overlaps the hero image, so the campus
          photo and the numbers read as one composition. */}
      <section aria-label="Our impact by the numbers" className="relative z-10 mx-auto -mt-14 max-w-6xl px-6 sm:-mt-20">
        <div className="ssc-card rounded-3xl bg-card/95 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
          <StatCounter stats={home.stats} />
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading
          eyebrow={home.pillarsSection.eyebrow}
          title={home.pillarsSection.title}
          intro={home.pillarsSection.intro}
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {home.pillarsSection.items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="ssc-card group flex h-full flex-col gap-3 p-7 hover:-translate-y-1"
              >
                <p className="eyebrow">{item.label}</p>
                <h3 className="font-display text-xl font-semibold">{item.heading}</h3>
                <p className="flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                <span className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-primary">
                  Read more
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-12 max-w-3xl text-pretty text-center text-lg leading-relaxed">
          {home.pillarsSection.closing}
        </p>
      </section>

      {/* Services */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={home.whyUs.eyebrow}
            title={home.whyUs.title}
            intro={home.whyUs.intro}
            align="center"
          />

          <ul className="mt-12 grid gap-6 lg:grid-cols-3">
            {site.services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/${service.slug}`}
                  className="ssc-card group flex h-full flex-col overflow-hidden hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={service.image}
                      alt={`${service.label} at ${service.household}, Sheboygan Senior Community`}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wider text-primary">
                      {service.household}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <h3 className="font-display text-2xl font-semibold">{service.label}</h3>
                    <p className="flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">{service.blurb}</p>
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-semibold text-primary">
                      Learn more
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Testimonials
        eyebrow="What The Community Has To Say"
        title="Client Testimonials"
        intro="The true measure of our impact lies in the stories of those we serve. Hear firsthand how Sheboygan Senior Community has made a difference in the lives of our residents and their families. Their experiences highlight our commitment to compassionate care, vibrant community, and unwavering support. These testimonials reflect the 'SSC Difference' – a place where residents truly feel at home."
      />

      <CtaBand
        title="Come see the SSC difference for yourself"
        body="Schedule a personalized tour of our 40-acre campus, or reach out to talk through the care options available for your loved one."
        primary={{ label: "Embrace the Next Chapter", href: "/contact" }}
        secondary={{ label: "Explore Careers", href: "/employment" }}
      />
    </>
  )
}
