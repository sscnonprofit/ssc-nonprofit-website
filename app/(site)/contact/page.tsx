import type { Metadata } from "next"
import { Clock, Mail, MapPin, Phone } from "lucide-react"

import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { ContactForm } from "@/components/contact-form"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { getContent } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about care, tours, or availability at Sheboygan Senior Community? Call (920) 458-2137 or send us a message.",
}

export default async function ContactPage() {
  const site = await getContent("site", siteFallback)
  const mapQuery = encodeURIComponent(
    `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`,
  )

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact Us"
        body="Questions or comments? We would love to hear from you and help however we can."
        image="/images/DJI_0072-scaled-1.webp"
        imageAlt="Aerial view of the Sheboygan Senior Community campus"
      />

      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Details */}
          <div className="flex flex-col gap-10">
            <div>
              <BrandRule />
              <h2 className="mt-5 font-display text-3xl font-semibold">Visit or call us</h2>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                Our main line is answered by a real person during business hours. For a tour, ask for Admissions.
              </p>
            </div>

            <dl className="flex flex-col gap-6">
              <div className="flex gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Phone
                  </dt>
                  <dd className="mt-1">
                    <a href={site.phoneHref} className="text-lg font-semibold hover:text-accent">
                      {site.phone}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Address
                  </dt>
                  <dd className="mt-1 leading-relaxed">
                    {site.address.street}
                    <br />
                    {site.address.city}, {site.address.state} {site.address.zip}
                  </dd>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Visiting
                  </dt>
                  <dd className="mt-1 leading-relaxed text-muted-foreground">
                    Family and friends are welcome. Call ahead so we can have someone ready to greet you.
                  </dd>
                </div>
              </div>
            </dl>

            <div className="overflow-hidden rounded-2xl border border-border/70 shadow-[0_1px_2px_rgba(30,10,16,0.04)]">
              <iframe
                title={`Map of ${site.name}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                width="100%"
                height="300"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block border-0"
              />
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
            <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tell us a little about what you need and the right person will follow up.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Who to ask for */}
      <section className="border-t border-border bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Directory"
            title="Who to ask for"
            intro="Reach the right department directly. All extensions run through our main line."
          />
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {site.contacts.map((c) => (
              <li key={c.name} className="ssc-card flex flex-col gap-2 p-7">
                <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                <p className="text-sm font-medium text-accent">{c.role}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{c.topic}</p>
                <div className="mt-auto flex flex-col gap-1.5 pt-4 text-sm">
                  <a href={site.phoneHref} className="inline-flex items-center gap-2 hover:text-accent">
                    <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                    {c.phone}
                  </a>
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 break-all hover:text-accent">
                      <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                      {c.email}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
