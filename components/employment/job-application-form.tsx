"use client"

import { useRef, useState, useTransition } from "react"
import { CheckCircle2Icon, FileTextIcon, Loader2Icon, XIcon } from "lucide-react"

import { submitApplicationAction } from "@/app/admin/job-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function JobApplicationForm({ jobId, jobTitle }: { jobId: number; jobTitle: string }) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [resume, setResume] = useState<{ url: string; filename: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadError("")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/jobs/resume", { method: "POST", body: formData })
      const data = await response.json()
      if (!response.ok) {
        setUploadError(data.error ?? "Couldn't upload that file.")
        return
      }
      setResume({ url: data.url, filename: data.filename ?? file.name })
    } catch {
      setUploadError("Couldn't upload that file. Try again.")
    } finally {
      setUploading(false)
    }
  }

  function clearResume() {
    setResume(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function submit(formData: FormData) {
    setError("")
    const input = Object.fromEntries(formData.entries()) as Record<string, string>
    startTransition(async () => {
      const result = await submitApplicationAction({
        jobId,
        fullName: input.fullName ?? "",
        email: input.email ?? "",
        phone: input.phone,
        address: input.address,
        availability: input.availability,
        desiredPay: input.desiredPay,
        startDate: input.startDate,
        yearsExperience: input.yearsExperience,
        referralSource: input.referralSource,
        coverLetter: input.coverLetter,
        resumeUrl: resume?.url ?? "",
        resumeFilename: resume?.filename ?? "",
        eligibleToWork: input.eligibleToWork === "on",
      })
      if (result.ok) {
        setSent(true)
      } else {
        setError(result.error ?? "Unable to send your application.")
      }
    })
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-10 text-center">
        <CheckCircle2Icon className="size-8 text-primary" aria-hidden="true" />
        <h3 className="font-display text-xl font-semibold">Application received</h3>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">
          Thank you for applying to {jobTitle}. Our hiring team will review your application and reach out if you&apos;re a fit.
        </p>
      </div>
    )
  }

  return (
    <form action={submit} className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label="Full name">
          <Input id="fullName" name="fullName" required maxLength={160} className="h-11 text-base" />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" required maxLength={200} className="h-11 text-base" />
        </Field>
        <Field id="phone" label="Phone">
          <Input id="phone" name="phone" type="tel" inputMode="tel" maxLength={60} className="h-11 text-base" />
        </Field>
        <Field id="address" label="Address" hint="City and state is fine.">
          <Input id="address" name="address" maxLength={300} className="h-11 text-base" />
        </Field>
        <Field id="availability" label="Availability" hint="e.g. Weekdays, overnights, weekends">
          <Input id="availability" name="availability" maxLength={200} className="h-11 text-base" />
        </Field>
        <Field id="desiredPay" label="Desired pay" hint="Optional">
          <Input id="desiredPay" name="desiredPay" maxLength={120} className="h-11 text-base" />
        </Field>
        <Field id="startDate" label="Earliest start date">
          <Input id="startDate" name="startDate" placeholder="Immediately, or a date" maxLength={120} className="h-11 text-base" />
        </Field>
        <Field id="yearsExperience" label="Relevant experience" hint="e.g. 3 years in long-term care">
          <Input id="yearsExperience" name="yearsExperience" maxLength={120} className="h-11 text-base" />
        </Field>
      </div>

      <Field id="referralSource" label="How did you hear about us?" hint="Optional">
        <Input id="referralSource" name="referralSource" maxLength={200} className="h-11 text-base" />
      </Field>

      <Field id="coverLetter" label="Tell us about yourself" hint="A short cover letter or note to the hiring team.">
        <Textarea id="coverLetter" name="coverLetter" rows={5} maxLength={4000} className="text-base" />
      </Field>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="resume-upload">Resume</Label>
        {resume ? (
          <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground">
              <FileTextIcon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{resume.filename}</span>
            </span>
            <button type="button" onClick={clearResume} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove resume">
              <XIcon className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2">
            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
            />
            {uploading ? <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
          </div>
        )}
        <p className="text-xs text-muted-foreground">PDF or Word document, up to 8MB. Optional, but recommended.</p>
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-foreground">
        <input name="eligibleToWork" type="checkbox" className="size-4 rounded border-input" />I am legally eligible to work in the United States
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={pending || uploading} className="h-12 text-base">
        {pending ? "Sending application..." : "Submit application"}
      </Button>
    </form>
  )
}
