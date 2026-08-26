import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Award, Star } from "lucide-react"

import home from "@/content/home.json"
import site from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { SectionHeading } from "@/components/section-heading"
import { StatCounter } from "@/components/stat-counter"
import { Testimonials } from "@/components/testimonials"

export const metadata: Metadata = {
  title: home.seo.title,
  description: home.seo.description,
  alternates: { canonical: "/" },
}

export default function HomePage() {
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
          className="-z-10 object-cover"
        />
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary/94 to-primary/55"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32">
          <div className="max-w-3xl">
            <BrandRule className="w-24" />
            <h1 className="mt-6 text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl">{home.hero.title}</h1>
            <p className="mt-6 text-pretty leading-relaxed text-primary-foreground/85">{home.hero.body}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/donate"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-display font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                Donate Now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-primary-foreground/35 px-7 py-3.5 font-display font-semibold transition-colors hover:bg-primary-foreground/10"
              >
                Schedule A Visit
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Award className="size-4 text-accent" aria-hidden="true" />
                U.S. News &amp; World Report &ldquo;Best Nursing Home&rdquo;
              </li>
              <li className="flex items-center gap-2">
                <Star className="size-4 text-accent" aria-hidden="true" />
                Consistently ranked a 5-Star facility
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Our impact by the numbers" className="border-b border-border bg-secondary/60">
        <div className="mx-auto max-w-7xl px-6 py-14">
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
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
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
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
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
        primary={{ label: "Schedule A Visit", href: "/contact" }}
        secondary={{ label: "Explore Careers", href: "/careers" }}
      />
    </>
  )
}
