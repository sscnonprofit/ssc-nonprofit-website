import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Phone } from "lucide-react"

import servicesFallback from "@/content/services.json"
import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { FaqAccordion } from "@/components/faq-accordion"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { getContent } from "@/lib/cms/content"

type ServiceSlug = keyof typeof servicesFallback

export async function ServicePage({ slug }: { slug: ServiceSlug }) {
  const [services, site] = await Promise.all([
    getContent("services", servicesFallback),
    getContent("site", siteFallback),
  ])
  const mergedServices = { ...servicesFallback, ...services }
  const service = mergedServices[slug]
  const related = service.related
    .map((r) => mergedServices[r as ServiceSlug])
    .filter(Boolean)

  return (
    <>
      <PageHero
        eyebrow={service.eyebrow}
        title={service.title}
        body={service.intro}
        image={service.heroImage}
        imageAlt={service.heroImageAlt}
        badge={service.household}
      />

      {/* Services provided */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading title="Services Provided" intro={service.servicesIntro} />

        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {service.features.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-3 border-t-2 border-primary/15 pt-5">
              <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Gallery */}
      <section aria-label={`Photos of ${service.household}`} className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4">
            <BrandRule />
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">Inside {service.household}</h2>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {service.gallery.map((photo) => (
              <li key={photo.src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start">
            <BrandRule />
            <p className="eyebrow">{service.faqEyebrow}</p>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">{service.faqTitle}</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Have additional questions or concerns? Our team is happy to help.
            </p>
            <div className="mt-2 flex flex-col gap-3">
              <a
                href={site.phoneHref}
                className="inline-flex w-fit items-center gap-2 font-display font-semibold text-primary hover:underline"
              >
                <Phone className="size-4" aria-hidden="true" />
                {site.phone}
              </a>
              <Link
                href="/contact"
                className="inline-flex w-fit items-center gap-1.5 font-display font-semibold text-primary hover:underline"
              >
                Visit our contact page
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <FaqAccordion items={service.faqs} />
        </div>
      </section>

      {/* Related options */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            title="Explore Our Other Living Options"
            intro="Because all three levels of care share one campus, residents can move between them as their needs change — without the stress of moving facilities."
            align="center"
          />

          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {related.map((option) => (
              <li key={option.slug}>
                <Link
                  href={`/${option.slug}`}
                  className="group relative isolate flex min-h-72 flex-col justify-end overflow-hidden rounded-2xl p-8 text-primary-foreground"
                >
                  <Image
                    src={option.heroImage}
                    alt={option.heroImageAlt}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/70 to-primary/15"
                    aria-hidden="true"
                  />
                  <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    {option.household}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{option.title}</h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-display text-sm font-semibold">
                    Learn more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title={`Ready to learn more about ${service.household}?`}
        body="Schedule a personalized tour, or call to talk through availability, costs, and what daily life looks like for your loved one."
        primary={{ label: "Schedule A Visit", href: "/contact" }}
        secondary={{ label: `Call ${site.phone}`, href: site.phoneHref }}
      />
    </>
  )
}
