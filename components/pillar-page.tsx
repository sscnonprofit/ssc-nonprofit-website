import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import pillarsFallback from "@/content/pillars.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { StatCounter } from "@/components/stat-counter"
import { Testimonials } from "@/components/testimonials"
import { getContent } from "@/lib/cms/content"

type PillarKey = keyof typeof pillarsFallback

export async function PillarPage({ slug }: { slug: PillarKey }) {
  const pillars = await getContent("pillars", pillarsFallback)
  const p = pillars[slug]
  const others = (Object.keys(pillars) as PillarKey[]).filter((k) => k !== slug)
  const stats = "stats" in p ? p.stats : undefined
  const callout = "callout" in p ? p.callout : undefined
  const intro2 = "intro2" in p ? p.intro2 : undefined
  const partners = "partners" in p ? p.partners : undefined
  const benefitsCta = "cta" in p.benefits ? p.benefits.cta : undefined

  return (
    <>
      <PageHero
        eyebrow={p.eyebrow}
        title={p.title}
        image={p.heroImage}
        imageAlt={p.heroImageAlt}
      />

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <BrandRule />
        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">{p.intro}</p>
        {intro2 ? <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{intro2}</p> : null}
      </section>

      {/* Stats (environment only) */}
      {stats ? (
        <section className="border-y border-border bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <StatCounter stats={stats} tone="dark" />
          </div>
        </section>
      ) : null}

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <SectionHeading eyebrow={p.benefits.eyebrow} title={p.benefits.title} intro={p.benefits.body} />
        {benefitsCta ? (
          <CtaLink
            href={benefitsCta.href}
            className="group mt-8 inline-flex items-center gap-2 rounded-none bg-accent px-6 py-3.5 font-display font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            {benefitsCta.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </CtaLink>
        ) : null}

        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {p.benefits.items.map((item) => (
            <li key={item.title} className="ssc-card flex flex-col gap-3 p-8">
              <h3 className="font-display text-xl font-semibold">{item.title}</h3>
              <p className="text-pretty leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Callout */}
      {callout ? (
        <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-24">
          <div className="flex flex-col gap-6 rounded-3xl bg-secondary p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-semibold">{callout.title}</h2>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{callout.body}</p>
            </div>
            {callout.cta ? (
              <CtaLink
                href={callout.cta.href}
                className="group inline-flex shrink-0 items-center gap-2 rounded-none bg-primary px-6 py-3.5 font-display font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                {callout.cta.label}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </CtaLink>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Partners */}
      {partners ? (
        <section className="border-y border-border bg-secondary py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              eyebrow="Partners"
              title="Organizations we stand beside"
              intro="A few of the local causes and nonprofit partners we support each year."
              align="center"
            />
            <ul className="mt-12 grid grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {partners.map((partner) => (
                <li key={partner.name} className="flex items-center justify-center">
                  <Image
                    src={partner.logo || "/placeholder.svg"}
                    alt={partner.name}
                    width={180}
                    height={90}
                    className="h-16 w-auto max-w-full object-contain"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Gallery */}
      {p.gallery?.length ? (
        <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <SectionHeading eyebrow="Gallery" title="Life at SSC" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.gallery.map((g) => (
              <li key={g.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-[0_1px_2px_rgba(30,10,16,0.04)]">
                <Image
                  src={g.src || "/placeholder.svg"}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Testimonials />

      {/* Other pillars */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-24">
        <SectionHeading eyebrow="Pillars" title="Explore Our Other Pillars" />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {others.map((key) => (
            <li key={key}>
              <Link
                href={`/${key}`}
                className="ssc-card group flex h-full flex-col gap-3 p-7 hover:-translate-y-1 hover:border-accent/50"
              >
                <h3 className="font-display text-xl font-semibold">{pillars[key].navLabel}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {pillars[key].metaDescription}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-accent">
                  Learn more
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand
        title="Ready to learn more about SSC?"
        body="Schedule a visit and see how our pillars shape daily life on campus."
      />
    </>
  )
}

/**
 * Renders an absolute URL as a plain anchor (opening in a new tab) and an
 * in-app path through next/link, so content JSON can mix the two freely.
 */
function CtaLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
