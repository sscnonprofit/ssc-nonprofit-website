import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon, BriefcaseIcon, CalendarIcon, MapPinIcon } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { JobApplicationForm } from "@/components/employment/job-application-form"
import { employmentTypeLabel, formatEventDate, getPublicJob } from "@/lib/employment/jobs"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) return {}
  return { title: job.title, description: job.summary || job.description.slice(0, 160) }
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function lines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const job = await getPublicJob(slug)
  if (!job) notFound()

  const closing = job.closingDate ? new Date(job.closingDate) : null
  const closed = closing ? closing.getTime() < Date.now() : false
  const canApply = job.status === "open" && job.applicationsEnabled && !closed

  return (
    <>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <Link href="/employment#open-positions" className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to open positions
          </Link>
          <BrandRule className="mt-6" />
          <h1 className="mt-6 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">{job.title}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {job.department ? (
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseIcon className="size-4" aria-hidden="true" />
                {job.department}
              </span>
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-4" aria-hidden="true" />
                {job.location}
              </span>
            ) : null}
            <span>{employmentTypeLabel(job.employmentType)}</span>
            {job.payRange ? <span>{job.payRange}</span> : null}
            {closing ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="size-4" aria-hidden="true" />
                {closed ? "Applications closed" : `Apply by ${formatEventDate(closing, { month: "long", day: "numeric", year: "numeric" })}`}
              </span>
            ) : null}
          </div>
          {job.summary ? <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">{job.summary}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="flex flex-col gap-10">
          {job.description ? (
            <div className="flex flex-col gap-4">
              {paragraphs(job.description).map((paragraph, index) => (
                <p key={index} className="text-pretty leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {job.requirements ? (
            <div>
              <h2 className="font-display text-xl font-semibold">Requirements</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {lines(job.requirements).map((item, index) => (
                  <li key={index} className="flex gap-3 text-pretty leading-relaxed text-muted-foreground">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {job.benefits ? (
            <div>
              <h2 className="font-display text-xl font-semibold">Benefits</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {lines(job.benefits).map((item, index) => (
                  <li key={index} className="flex gap-3 text-pretty leading-relaxed text-muted-foreground">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Apply for this position</h2>
          {canApply ? (
            <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
              Complete the form below. We review every application and will follow up by email.
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
              {closed ? "The application deadline for this position has passed." : "This position is not currently accepting applications."}
              {job.contactEmail ? (
                <>
                  {" "}If you&apos;d still like to connect, contact {job.contactName || "our hiring team"} at{" "}
                  <a href={`mailto:${job.contactEmail}`} className="font-medium text-accent underline-offset-2 hover:underline">
                    {job.contactEmail}
                  </a>
                  .
                </>
              ) : null}
            </p>
          )}
          <div className="mt-8">{canApply ? <JobApplicationForm jobId={job.id} jobTitle={job.title} /> : null}</div>
        </div>
      </section>
    </>
  )
}
