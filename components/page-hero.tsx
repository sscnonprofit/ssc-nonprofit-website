import Image from "next/image"

import { BrandRule } from "@/components/brand-rule"

export function PageHero({
  eyebrow,
  title,
  body,
  image,
  imageAlt,
  badge,
}: {
  eyebrow: string
  title: string
  /** Lead paragraph shown beneath the title. */
  body?: string
  image: string
  imageAlt: string
  /** Optional pill above the title, e.g. the household name. */
  badge?: string
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="-z-10 object-cover" />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/93 to-primary/55"
        aria-hidden="true"
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-20 sm:py-28">
        <BrandRule />
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
          {badge ? (
            <span className="rounded-full border border-primary-foreground/30 px-3 py-1 font-display text-xs font-semibold uppercase tracking-wider">
              {badge}
            </span>
          ) : null}
        </div>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl">{title}</h1>
        {body ? <p className="max-w-3xl text-pretty leading-relaxed text-primary-foreground/85">{body}</p> : null}
      </div>
    </section>
  )
}
