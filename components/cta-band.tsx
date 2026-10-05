import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"

export function CtaBand({
  title,
  body,
  primary = { label: "Schedule A Visit", href: "/contact" },
  secondary,
}: {
  title: string
  body?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="relative flex flex-col gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[oklch(0.3_0.128_12.5)] px-8 py-14 text-primary-foreground shadow-[0_32px_64px_-32px_rgba(30,10,16,0.45)] sm:px-14 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex max-w-2xl flex-col gap-4">
          <BrandRule />
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">{title}</h2>
          {body ? <p className="text-pretty leading-relaxed text-primary-foreground/85">{body}</p> : null}
        </div>
        <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href={primary.href}
            className="group inline-flex items-center justify-center gap-2 rounded-none bg-accent px-6 py-3.5 font-display font-semibold text-accent-foreground shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25"
          >
            {primary.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex items-center justify-center rounded-none border border-primary-foreground/35 px-6 py-3.5 font-display font-semibold backdrop-blur-sm transition-colors hover:bg-primary-foreground/10"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
