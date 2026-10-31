import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, BriefcaseIcon, CalendarIcon, CheckIcon, ClockIcon, DollarSignIcon, MailIcon, MapPinIcon } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { JobApplicationForm } from "@/components/employment/job-application-form"
import { employmentTypeLabel, formatEventDate, getPublicJob } from "@/lib/employment/jobs"
import { toListItems, toParagraphs } from "@/lib/employment/format"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) return {}
  return { title: job.title, description: job.summary || job.description.slice(0, 160) }
}

function ChecklistSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby={`${title.toLowerCase()}-heading`}>
      <h2 id={`${title.toLowerCase()}-heading`} className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-pretty leading-relaxed text-foreground/80">
            <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
              <CheckIcon className="size-3" strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function OverviewRow({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-pretty text-sm font-medium text-foreground">{children}</dd>
      </div>
    </div>
  )
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) notFound()

  const closing = job.closingDate ? new Date(job.closingDate) : null
  const closed = closing ? closing.getTime() < Date.now() : false
  const canApply = job.status === "open" && job.applicationsEnabled && !closed
  const requirements = toListItems(job.requirements)
  const benefits = toListItems(job.benefits)
  const closingLabel = closing ? formatEventDate(closing, { month: "long", day: "numeric", year: "numeric" }) : null

  return (
    <>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <Link
            href="/employment#open-positions"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to open positions
          </Link>
          <BrandRule className="mt-4" />
          <h1 className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">{job.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{employmentTypeLabel(job.employmentType)}</span>
            {job.department ? <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">{job.department}</span> : null}
            {job.location ? <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">{job.location}</span> : null}
            {closed ? <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Applications closed</span> : null}
          </div>
          {job.summary ? <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{job.summary}</p> : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-12">
          {job.description ? (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-2xl font-semibold tracking-tight">
                About the role
              </h2>
              <div className="mt-5 flex flex-col gap-4">
                {toParagraphs(job.description).map((paragraph, index) => (
                  <p key={index} className="text-pretty leading-relaxed text-foreground/80">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <ChecklistSection title="Requirements" items={requirements} />
          <ChecklistSection title="Benefits" items={benefits} />

          <section id="apply" aria-labelledby="apply-heading" className="scroll-mt-28 border-t border-border pt-12">
            <h2 id="apply-heading" className="font-display text-2xl font-semibold tracking-tight">
              Apply for this position
            </h2>
            {canApply ? (
              <>
                <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
                  Takes about five minutes. Fields marked with an asterisk are required. We review every application and follow up by email.
                </p>
                <div className="mt-8">
                  <JobApplicationForm jobId={job.id} jobTitle={job.title} />
                </div>
              </>
            ) : (
              <div className="mt-4 max-w-xl rounded-2xl border border-border bg-card p-6">
                <p className="text-pretty text-muted-foreground">
                  {closed ? "The application deadline for this position has passed." : "This position is not currently accepting applications."}
                </p>
                {job.contactEmail ? (
                  <p className="mt-3 text-pretty text-muted-foreground">
                    If you&apos;d still like to connect, contact {job.contactName || "our hiring team"} at{" "}
                    <a href={`mailto:${job.contactEmail}`} className="font-medium text-primary underline-offset-2 hover:underline">
                      {job.contactEmail}
                    </a>
                    .
                  </p>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <aside aria-label="Position overview" className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold">Position overview</h2>
            <dl className="mt-5 flex flex-col gap-4">
              <OverviewRow icon={ClockIcon} label="Schedule">
                {employmentTypeLabel(job.employmentType)}
              </OverviewRow>
              {job.payRange ? (
                <OverviewRow icon={DollarSignIcon} label="Pay">
                  {job.payRange}
                </OverviewRow>
              ) : null}
              {job.department ? (
                <OverviewRow icon={BriefcaseIcon} label="Department">
                  {job.department}
                </OverviewRow>
              ) : null}
              {job.location ? (
                <OverviewRow icon={MapPinIcon} label="Location">
                  {job.location}
                </OverviewRow>
              ) : null}
              {closingLabel ? (
                <OverviewRow icon={CalendarIcon} label={closed ? "Closed" : "Apply by"}>
                  {closingLabel}
                </OverviewRow>
              ) : null}
              {job.contactEmail ? (
                <OverviewRow icon={MailIcon} label="Questions">
                  <a href={`mailto:${job.contactEmail}`} className="break-all text-primary underline-offset-2 hover:underline">
                    {job.contactName || job.contactEmail}
                  </a>
                </OverviewRow>
              ) : null}
            </dl>
            {canApply ? (
              <Link
                href="#apply"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Apply now
              </Link>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  )
}
