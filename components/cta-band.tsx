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
      <div className="flex flex-col gap-8 rounded-3xl bg-primary px-8 py-14 text-primary-foreground sm:px-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-4">
          <BrandRule />
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">{title}</h2>
          {body ? <p className="text-pretty leading-relaxed text-primary-foreground/85">{body}</p> : null}
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Link
            href={primary.href}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-display font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            {primary.label}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex items-center justify-center rounded-full border border-primary-foreground/35 px-6 py-3.5 font-display font-semibold transition-colors hover:bg-primary-foreground/10"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
