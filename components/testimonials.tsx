import site from "@/content/site.json"
import { SectionHeading } from "@/components/section-heading"

export function Testimonials({
  eyebrow = "What the community has to say",
  title = "Client Testimonials",
  intro,
}: {
  eyebrow?: string
  title?: string
  intro?: string
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeading eyebrow={eyebrow} title={title} intro={intro} align="center" />

      <ul className="mt-12 grid gap-6 md:grid-cols-3">
        {site.testimonials.map((t) => (
          <li key={t.name} className="ssc-card flex flex-col gap-5 p-7">
            <span className="font-display text-5xl leading-none text-accent" aria-hidden="true">
              &ldquo;
            </span>
            <blockquote className="flex-1 text-pretty leading-relaxed text-muted-foreground">{t.quote}</blockquote>
            <p className="font-display font-semibold text-primary">{t.name}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
