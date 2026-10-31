import Image from "next/image"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { CtaBand } from "@/components/cta-band"
import type { LeadershipContent } from "@/lib/cms/leadership"

export function LeadershipPageContent({ content }: { content: LeadershipContent }) {
  const members = content.team.members.filter((member) => member.visible)
  return (
    <>
      <PageHero {...content.hero} />
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 sm:py-24">
        <SectionHeading title={content.team.title} intro={content.team.body} />
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {members.map((member, index) => (
            <li key={`${index}-${member.name}`} className="flex min-w-0 flex-col gap-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted">
                {member.image ? <Image src={member.image} alt={member.imageAlt || member.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw" className="object-cover object-top" /> : <span className="flex h-full items-center justify-center text-2xl text-muted-foreground" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).join("")}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-base font-semibold">{member.name}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
        {members.filter((member) => Object.values(member.bio).some((value) => value.trim())).map((member, index) => (
          <article key={`${index}-${member.name}`} className="grid gap-8 rounded-2xl border border-border bg-card p-6 sm:p-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted">
              {member.image ? <Image src={member.image} alt={member.imageAlt || member.name} fill sizes="(max-width: 768px) 100vw, 30vw" className="object-cover object-top" /> : <span className="flex h-full items-center justify-center text-2xl text-muted-foreground" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).join("")}</span>}
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-2xl font-semibold">{member.name}</h2>
                <p className="text-muted-foreground">{member.role}</p>
                {member.bio.tenure && <p className="whitespace-pre-line leading-relaxed">{member.bio.tenure}</p>}
              </div>
              <dl className="flex flex-col gap-6">
              {(["why", "family", "favorite"] as const).map((key) => member.bio[key] ? (
                <div key={key} className="flex flex-col gap-2">
                  <dt className="font-semibold">{content.biographyLabels[key]}</dt>
                  <dd className="whitespace-pre-line leading-relaxed text-muted-foreground">{member.bio[key]}</dd>
                </div>
                ) : null)}
              </dl>
            </div>
          </article>
        ))}
      </section>
      {content.cta.visible && <CtaBand title={content.cta.title} body={content.cta.body} primary={content.cta.primary} />}
    </>
  )
}
