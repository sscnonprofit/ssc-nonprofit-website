import Link from "next/link"
import { ArrowRightIcon, MapPinIcon } from "lucide-react"

import { SectionHeading } from "@/components/section-heading"
import { employmentTypeLabel, listPublicJobs } from "@/lib/employment/jobs"

export async function OpenPositions() {
  const jobs = await listPublicJobs()
  const open = jobs.filter((job) => job.status === "open")

  return (
    <section id="open-positions" className="border-y border-border bg-secondary py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Join Our Team"
          title="Open Positions"
          intro="Browse current openings and apply directly online. Every application is reviewed by our team."
        />

        {open.length === 0 ? (
          <p className="mt-10 text-pretty text-muted-foreground">
            We don&apos;t have any open positions listed right now. Check back soon, or reach out to tell us about yourself.
          </p>
        ) : (
          <ul className="mt-10 flex flex-col gap-3">
            {open.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/employment/${job.slug}`}
                  className="ssc-card group flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-balance font-display text-lg font-semibold">{job.title}</h3>
                      {job.featured ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Featured</span>
                      ) : null}
                    </div>
                    {job.summary ? <p className="mt-1.5 line-clamp-2 max-w-2xl text-pretty text-sm text-muted-foreground">{job.summary}</p> : null}
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground/80">
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">{employmentTypeLabel(job.employmentType)}</span>
                      {job.department ? <span>{job.department}</span> : null}
                      {job.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPinIcon className="size-3.5 text-primary" aria-hidden="true" />
                          {job.location}
                        </span>
                      ) : null}
                      {job.payRange ? <span className="font-medium">{job.payRange}</span> : null}
                    </p>
                  </div>
                  <span className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-primary">
                    View &amp; apply
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
