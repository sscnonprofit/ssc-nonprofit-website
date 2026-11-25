import type { Metadata } from "next"
import { Clock, MapPin, Star } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { PageHero } from "@/components/page-hero"
import { getContent } from "@/lib/cms/content"
import { CAFE_MENU_SLUG, formatPrice, getCafeMenu, publicSections, safeImageUrl, DEFAULT_HERO_IMAGE } from "@/lib/cafe/menu"

async function loadMenu() {
  return getCafeMenu(await getContent<unknown>(CAFE_MENU_SLUG, null))
}

export async function generateMetadata(): Promise<Metadata> {
  const menu = await loadMenu()
  return {
    title: menu.title,
    description: menu.intro.slice(0, 160) || "See what's on the menu at the Sheboygan Senior Community café, with current prices.",
  }
}

export default async function CafeMenuPage() {
  const menu = await loadMenu()
  const sections = menu.enabled ? publicSections(menu) : []
  const hours = menu.hours.split("\n").map((line) => line.trim()).filter(Boolean)

  return (
    <>
      <PageHero
        eyebrow="Café"
        title={menu.title}
        body={menu.intro || undefined}
        image={safeImageUrl(menu.heroImage) ? menu.heroImage : DEFAULT_HERO_IMAGE}
        imageAlt=""
      />

      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        {sections.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <BrandRule />
            <h2 className="ssc-h2 text-balance">Our menu is coming soon</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">
              The café menu isn&apos;t posted right now. Please check back soon, or stop by the café to see today&apos;s offerings.
            </p>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
            <div className="flex min-w-0 flex-col gap-14">
              {sections.length > 2 ? (
                <nav aria-label="Menu sections" className="flex flex-wrap gap-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#menu-${section.id}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      {section.name}
                    </a>
                  ))}
                </nav>
              ) : null}

              {sections.map((section) => (
                <section key={section.id} id={`menu-${section.id}`} aria-labelledby={`menu-${section.id}-title`} className="scroll-mt-28">
                  <BrandRule />
                  <h2 id={`menu-${section.id}-title`} className="ssc-h2 mt-4 text-balance">{section.name}</h2>
                  {section.description ? <p className="mt-2 max-w-2xl text-pretty text-muted-foreground">{section.description}</p> : null}
                  <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
                    {section.items.map((item) => (
                      <li key={item.id} className={item.featured ? "-mx-4 rounded-lg bg-primary/[0.05] px-4 py-5" : "py-5"}>
                        <div className="flex items-baseline gap-3">
                          <h3 className={`font-display text-lg font-semibold ${item.available ? "" : "text-muted-foreground"}`}>
                            {item.name}
                          </h3>
                          <span className="min-w-6 flex-1 translate-y-[-0.3em] border-b border-dotted border-foreground/25" aria-hidden="true" />
                          {item.price ? (
                            <span className={`shrink-0 font-display text-lg font-semibold tabular-nums ${item.available ? "text-primary" : "text-muted-foreground line-through"}`}>
                              {formatPrice(item.price)}
                            </span>
                          ) : null}
                        </div>
                        {item.priceNote ? <p className="mt-0.5 text-right text-sm text-muted-foreground">{item.priceNote}</p> : null}
                        {item.description ? <p className="mt-1.5 max-w-2xl text-pretty leading-relaxed text-muted-foreground">{item.description}</p> : null}
                        {item.featured || !item.available || item.tags.length ? (
                          <p className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                            {item.featured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-primary-foreground">
                                <Star className="size-3" aria-hidden="true" />Special
                              </span>
                            ) : null}
                            {!item.available ? (
                              <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">Not available today</span>
                            ) : null}
                            {item.tags.map((tag) => (
                              <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-foreground/80">{tag}</span>
                            ))}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {menu.footnote ? <p className="text-pretty text-sm italic text-muted-foreground">{menu.footnote}</p> : null}
            </div>

            {hours.length || menu.location ? (
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="ssc-card flex flex-col gap-6 p-6">
                  {hours.length ? (
                    <div className="flex gap-3">
                      <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <h2 className="font-display font-semibold">Hours</h2>
                        <ul className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {hours.map((line, index) => <li key={index}>{line}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                  {menu.location ? (
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <h2 className="font-display font-semibold">Location</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{menu.location}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </section>
    </>
  )
}
