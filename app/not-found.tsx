import Link from "next/link"
import { ArrowLeft, Phone } from "lucide-react"

import siteFallback from "@/content/site.json"
import { BrandRule } from "@/components/brand-rule"
import { getContent } from "@/lib/cms/content"

export default async function NotFound() {
  const site = await getContent("site", siteFallback)

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-start justify-center gap-6 px-6 py-24">
      <BrandRule />
      <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="text-balance font-display text-4xl font-semibold sm:text-5xl">We couldn&apos;t find that page</h1>
      <p className="text-pretty leading-relaxed text-muted-foreground">
        The page you&apos;re looking for may have moved. Head back home, or give us a call and we&apos;ll point you in
        the right direction.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          Back to home
        </Link>
        <a
          href={site.phoneHref}
          className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-3 font-display text-sm font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <Phone className="size-4" aria-hidden="true" />
          {site.phone}
        </a>
      </div>
    </main>
  )
}
