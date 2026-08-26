import Image from "next/image"

import { BrandRule } from "@/components/brand-rule"

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
}: {
  eyebrow: string
  title: string
  intro?: string
  image: string
  imageAlt: string
}) {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-25"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary via-primary/95 to-primary/70" aria-hidden="true" />

      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-20 sm:py-28">
        <BrandRule />
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="max-w-4xl text-balance text-4xl font-semibold sm:text-5xl lg:text-6xl">{title}</h1>
        {intro ? (
          <p className="max-w-3xl text-pretty leading-relaxed text-primary-foreground/85">{intro}</p>
        ) : null}
      </div>
    </section>
  )
}
