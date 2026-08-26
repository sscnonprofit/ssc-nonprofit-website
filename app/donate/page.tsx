import type { Metadata } from "next"
import { ArrowRight, FileText, Mail, Phone } from "lucide-react"

import site from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"

export const metadata: Metadata = {
  title: "Donate",
  description:
    "As a 501(c)(3) nonprofit, Sheboygan Senior Community relies on donors and community partners. Give by check, stock, or online.",
}

const philanthropy = site.contacts.find((c) => c.role === "Director of Philanthropy")

export default function DonatePage() {
  return (
    <>
      <PageHero
        eyebrow="Opportunities To Support Our Mission"
        title="Donations & Legacy Giving"
        body="A gift of care. A legacy of compassion."
        image="/images/Sheboygan-Senior-Community_Shape-the-Future_Interview_1.jpg"
        imageAlt="An SSC resident in conversation"
      />

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <BrandRule />
        <div className="mt-6 flex flex-col gap-5 text-pretty text-lg leading-relaxed text-muted-foreground">
          <p>
            For generations, Sheboygan Senior Community has been committed to providing compassionate care, dignity, and
            a true sense of home for older adults in our community.
          </p>
          <p>
            As a 501(c)(3) nonprofit organization, we rely on the generosity of donors, families, and community partners
            to help enhance the lives of those we serve. Your support helps fund resident programs, facility
            improvements, specialized services, and future initiatives that enrich the lives of our residents and
            strengthen our community.
          </p>
          <p>
            Through donations and legacy gifts, you can help ensure that older adults continue to receive the
            high-quality care, support, and respect they deserve for generations to come.
          </p>
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-y border-border bg-primary py-16 text-primary-foreground sm:py-20">
        <blockquote className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-balance font-display text-3xl font-semibold leading-tight sm:text-4xl">
            &ldquo;A gift of care. A legacy of compassion.&rdquo;
          </p>
        </blockquote>
      </section>

      {/* How to give */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <SectionHeading
          eyebrow="Ways to give"
          title="How to Give"
          body="Every gift, no matter the size, helps enhance resident programs, services, and opportunities that make Sheboygan Senior Community a special place to call home."
        />

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Checks */}
          <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-8">
            <h3 className="font-display text-xl font-semibold">Checks</h3>
            <p className="leading-relaxed text-muted-foreground">
              Checks made payable to &ldquo;Sheboygan Senior Community&rdquo; can be mailed to:
            </p>
            <address className="not-italic leading-relaxed">
              Sheboygan Senior Community
              <br />
              Attention: Sue Black
              <br />
              {site.address.street}
              <br />
              {site.address.city}, {site.address.state} {site.address.zip}
            </address>
            <a
              href={site.donorForm}
              target="_blank"
              rel="noreferrer"
              className="group mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary px-5 py-3 font-display text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <FileText className="size-4" aria-hidden="true" />
              Download Form
            </a>
          </li>

          {/* Stock */}
          <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-8">
            <h3 className="font-display text-xl font-semibold">Gifts of stock</h3>
            <p className="leading-relaxed text-muted-foreground">
              Gifts of stock or other appreciated assets can be made by contacting our philanthropy team at{" "}
              {site.developmentPhone}.
            </p>
            <a
              href={site.phoneHref}
              className="group mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-primary px-5 py-3 font-display text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Phone className="size-4" aria-hidden="true" />
              Call Now
            </a>
          </li>

          {/* Online */}
          <li className="flex flex-col gap-4 rounded-2xl border border-accent bg-card p-8">
            <h3 className="font-display text-xl font-semibold">Online Gift</h3>
            <p className="leading-relaxed text-muted-foreground">
              To make a gift online, visit our secure online donation page.
            </p>
            <a
              href={site.onlineGiving}
              target="_blank"
              rel="noreferrer"
              className="group mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 font-display text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              Donate Now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      {/* Questions */}
      {philanthropy ? (
        <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-24">
          <div className="flex flex-col gap-6 rounded-3xl bg-secondary p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-semibold">Questions about giving?</h2>
              <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                Please contact {philanthropy.name}, {philanthropy.role}, and she will walk you through the options.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <a
                href={site.phoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-display font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <Phone className="size-4" aria-hidden="true" />
                {site.phone}
              </a>
              {philanthropy.email ? (
                <a
                  href={`mailto:${philanthropy.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-6 py-3.5 font-display font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
