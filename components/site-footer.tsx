import Image from "next/image"
import Link from "next/link"
import { Facebook, Instagram, MapPin, Phone, Youtube } from "lucide-react"

import site from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"

const socialIcons = {
  Facebook,
  Instagram,
  YouTube: Youtube,
} as const

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <BrandRule className="h-1.5 w-full rounded-none" />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <div className="inline-flex rounded-lg bg-background px-4 py-3">
              <Image
                src="/images/ssc-logo.png"
                alt={`${site.name} logo`}
                width={200}
                height={54}
                className="h-10 w-auto"
              />
            </div>
            <p className="mt-5 text-sm leading-relaxed text-primary-foreground/80">{site.description}</p>

            <address className="mt-6 flex flex-col gap-3 text-sm not-italic">
              <a
                href="https://maps.google.com/?q=3505+County+Road+Y,+Sheboygan,+WI+53083"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 transition-opacity hover:opacity-80"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.state} {site.address.zip}
                </span>
              </a>
              <a href={site.phoneHref} className="flex items-center gap-3 transition-opacity hover:opacity-80">
                <Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />
                {site.phone}
              </a>
            </address>

            <ul className="mt-6 flex gap-3">
              {site.social.map((s) => {
                const Icon = socialIcons[s.label as keyof typeof socialIcons]
                return (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-10 items-center justify-center rounded-full border border-primary-foreground/25 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                      aria-label={s.label}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-14">
            {site.footer.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
                  {col.heading}
                </h2>
                <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-primary-foreground/20 pt-6 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright &copy; {new Date().getFullYear()} Sheboygan Senior Community. All rights reserved.</p>
          <p>A 501(c)(3) nonprofit organization serving Sheboygan County since {site.founded}.</p>
        </div>
      </div>
    </footer>
  )
}
