import type { Metadata } from "next"
import Image from "next/image"

import companyFallback from "@/content/company.json"
import { BrandRule } from "@/components/brand-rule"
import { CtaBand } from "@/components/cta-band"
import { HistoryTimeline } from "@/components/history-timeline"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"
import { TeamGrid } from "@/components/team-grid"
import { getContent } from "@/lib/cms/content"
import { getLeadershipContent } from "@/lib/cms/leadership-content"

export const metadata: Metadata = {
  title: "Our Company",
  description:
    "Sheboygan Senior Community is a faith-based nonprofit serving Sheboygan area seniors since 1962. Learn our history, mission, and meet our team.",
}

export default async function OurCompanyPage() {
  const [company, leadership] = await Promise.all([
    getContent("company", companyFallback),
    getLeadershipContent(),
  ])
  const visibleMembers = leadership.team.members.filter((member) => member.visible)
  const historyMilestones = company.history.milestones.map((milestone, index) => ({
    ...milestone,
    image: milestone.image || companyFallback.history.milestones[index]?.image || "/placeholder.svg",
  }))
  const ceo = visibleMembers.find((m) => m.bio)

  return (
    <>
      <PageHero
        eyebrow={company.hero.eyebrow}
        title={company.hero.title}
        body={company.hero.body}
        image={company.hero.image}
        imageAlt={company.hero.imageAlt}
      />

      {/* Story + mission */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-5">
            <BrandRule />
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{company.story.title}</h2>
            {company.story.paragraphs.map((p) => (
              <p key={p.slice(0, 32)} className="text-pretty leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>

          <aside className="self-start rounded-2xl bg-primary p-8 text-primary-foreground">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
              {company.story.mission.label}
            </h3>
            <p className="mt-4 text-pretty font-display text-xl leading-relaxed">{company.story.mission.text}</p>
          </aside>
        </div>
      </section>

      {/* History */}
      <section id="history" className="border-y border-border bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading title={company.history.title} intro={company.history.body} align="center" />
          <div className="mt-16">
            <HistoryTimeline milestones={historyMilestones} />
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section id="leadership" className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <SectionHeading title={company.team.title} intro={company.team.body} />
        <div className="mt-12">
          <TeamGrid members={visibleMembers} />
        </div>

        {ceo?.bio ? (
          <div className="mt-16 grid gap-10 rounded-3xl border border-border bg-card p-8 sm:p-12 lg:grid-cols-[280px_1fr] lg:gap-14">
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-[0_1px_2px_rgba(30,10,16,0.04)]">
              <Image
                src={ceo.image || "/placeholder.svg"}
                alt={ceo.name}
                fill
                sizes="280px"
                className="object-cover object-top"
              />
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <BrandRule />
                <h3 className="mt-4 font-display text-2xl font-semibold">{ceo.name}</h3>
                <p className="mt-1 text-sm font-medium uppercase tracking-wider text-accent">{ceo.role}</p>
                <p className="mt-4 leading-relaxed text-muted-foreground">{ceo.bio.tenure}</p>
              </div>

              <dl className="flex flex-col gap-6 border-t border-border pt-6">
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Why he loves working at SSC
                  </dt>
                  <dd className="mt-2 text-pretty leading-relaxed">{ceo.bio.why}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Family and pets
                  </dt>
                  <dd className="mt-2 leading-relaxed">{ceo.bio.family}</dd>
                </div>
                <div>
                  <dt className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    One favorite thing about Sheboygan County
                  </dt>
                  <dd className="mt-2 text-pretty leading-relaxed">{ceo.bio.favorite}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </section>

      <CtaBand
        title="Come see the campus for yourself"
        body="The best way to understand SSC is to walk the halls, meet the caregivers, and see the private rooms."
      />
    </>
  )
}
