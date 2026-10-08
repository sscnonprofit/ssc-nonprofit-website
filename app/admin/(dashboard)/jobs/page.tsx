import type { Metadata } from "next"

import { JobsManager } from "@/components/admin/jobs/jobs-manager"
import { getSessionUser } from "@/lib/cms/auth-helpers"
import { listAdminJobs } from "@/lib/employment/jobs"

export const metadata: Metadata = { title: "Jobs" }
export const dynamic = "force-dynamic"

export default async function JobsAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [user, jobs, params] = await Promise.all([getSessionUser(), listAdminJobs(), searchParams])
  const editId = Number(params.edit)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Post open positions on the Employment page and review applications as they come in.
        </p>
      </div>
      <JobsManager jobs={jobs} role={user?.role ?? "viewer"} initialEditId={Number.isInteger(editId) && editId > 0 ? editId : null} />
    </div>
  )
}
