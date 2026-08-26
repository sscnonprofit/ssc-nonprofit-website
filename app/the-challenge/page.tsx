import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import challenge from "@/content/challenge.json"
import { BrandRule } from "@/components/brand-rule"
import { PageHero } from "@/components/page-hero"
import { SectionHeading } from "@/components/section-heading"

export const metadata: Metadata = {
  title: "The Challenge",
  description:
    "Sheboygan County faces a growing senior living crisis. Learn how SSC's Next Chapter Campaign expands care, housing, and community spaces.",
}

export default function TheChallengePage() {
  return (
    <>
      <PageHero
        eyebrow={challenge.hero.eyebrow}
        title={challenge.hero.title}
        body={challenge.hero.body}
        image={challenge.hero.image}
        imageAlt={challenge.hero.imageAlt}
      />

      {/* Crisis intro */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <BrandRule />
        <h2 className="mt-6 text-balance font-display text-3xl font-semibold sm:text-4xl">{challenge.crisis.title}</h2>
        <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">{challenge.crisis.body}</p>
      </section>

      {/* Key challenges */}
      <section className="border-y border-border bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={challenge.keyChallenges.eyebrow}
            title={challenge.keyChallenges.title}
            body={challenge.keyChallenges.body}
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {challenge.keyChallenges.items.map((item) => (
              <li
                key={item.title}
                className="ssc-card flex flex-col overflow-hidden"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-7">
                  {item.stat ? (
                    <p className="font-display text-4xl font-semibold text-accent">{item.stat}</p>
                  ) : null}
                  <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                  <p className="text-pretty leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Solution */}
      <section className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <SectionHeading
          eyebrow={challenge.solution.eyebrow}
          title={challenge.solution.title}
          body={challenge.solution.body}
        />
      </section>

      {/* Phases */}
      <section className="mx-auto max-w-7xl px-6 pb-20 sm:pb-24">
        <div className="flex flex-col gap-16">
          {challenge.phases.map((phase) => (
            <div key={phase.label}>
              <div className="flex flex-col gap-3">
                <span className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
                  {phase.label}
                </span>
                <h2 className="text-balance font-display text-3xl font-semibold">{phase.title}</h2>
                <p className="max-w-3xl text-pretty leading-relaxed text-muted-foreground">{phase.body}</p>
              </div>
              <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {phase.items.map((item) => (
                  <li key={item.title} className="flex gap-4 border-t border-border pt-6">
                    <span
                      className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15"
                      aria-hidden="true"
                    >
                      <Check className="size-3.5 text-accent" />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold">{item.title}</h3>
                      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Progress */}
      <section className="border-y border-border bg-secondary py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading
            eyebrow={challenge.progress.eyebrow}
            title={challenge.progress.title}
            body={challenge.progress.body}
            align="center"
          />
          <ol className="mt-14 flex flex-col gap-8">
            {challenge.progress.steps.map((s) => (
              <li
                key={s.step}
                className={`flex gap-6 rounded-2xl border p-7 sm:p-8 ${
                  s.status === "current" ? "border-accent bg-card shadow-sm" : "border-border bg-card/60"
                }`}
              >
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold ${
                    s.status === "current"
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                  aria-hidden="true"
                >
                  {s.step}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                    {s.status === "current" ? (
                      <span className="rounded-full bg-accent/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
                        In progress
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2.5 text-pretty leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Join the mission */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border bg-muted">
            <Image
              src={challenge.join.image || "/placeholder.svg"}
              alt={challenge.join.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <BrandRule />
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
              {challenge.join.eyebrow}
            </p>
            <h2 className="text-balance font-display text-3xl font-semibold sm:text-4xl">{challenge.join.title}</h2>
            <p className="text-pretty leading-relaxed text-muted-foreground">{challenge.join.body}</p>
            <Link
              href="/donate"
              className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-4 font-display font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
            >
              Make A Donation
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
