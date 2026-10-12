"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { CheckCircle2Icon, FileTextIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react"

import { submitApplicationAction } from "@/app/admin/job-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const MAX_RESUME_BYTES = 8 * 1024 * 1024

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-0 p-0">
      <legend className="mb-1 p-0">
        <span className="block font-display text-lg font-semibold text-foreground">{title}</span>
        {description ? <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{description}</span> : null}
      </legend>
      {children}
    </fieldset>
  )
}

const inputClass = "h-12 text-base"

export function JobApplicationForm({ jobId, jobTitle }: { jobId: number; jobTitle: string }) {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [resume, setResume] = useState<{ url: string; filename: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirmationRef = useRef<HTMLDivElement>(null)

  async function uploadResume(file: File) {
    setUploadError("")
    if (file.size > MAX_RESUME_BYTES) {
      setUploadError("That file is larger than 8MB. Choose a smaller PDF or Word document.")
      return
    }
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void uploadResume(file)
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void uploadResume(file)
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
        website: input.website,
      })
      if (result.ok) {
        setSent(true)
        requestAnimationFrame(() => {
          confirmationRef.current?.focus()
          confirmationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        })
      } else {
        setError(result.error ?? "Unable to send your application.")
      }
    })
  }

  if (sent) {
    return (
      <div
        ref={confirmationRef}
        tabIndex={-1}
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center outline-none sm:p-12"
      >
        <CheckCircle2Icon className="size-10 text-primary" aria-hidden="true" />
        <h3 className="font-display text-2xl font-semibold">Application received</h3>
        <p className="max-w-md text-pretty text-muted-foreground">
          Thank you for applying to {jobTitle}. Our hiring team will review your application and reach out by email or phone if it&apos;s a fit.
        </p>
        <Button variant="outline" className="mt-2 h-11" nativeButton={false} render={<Link href="/employment#open-positions" />}>
          See other open positions
        </Button>
      </div>
    )
  }

  return (
    <form action={submit} className="grid gap-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <Group title="Your contact information" description="So we know how to reach you.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label="Full name" required>
            <Input id="fullName" name="fullName" autoComplete="name" required maxLength={160} className={inputClass} />
          </Field>
          <Field id="email" label="Email" required>
            <Input id="email" name="email" type="email" autoComplete="email" required maxLength={200} className={inputClass} />
          </Field>
          <Field id="phone" label="Phone">
            <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={60} className={inputClass} />
          </Field>
          <Field id="address" label="City and state">
            <Input id="address" name="address" autoComplete="address-level2" maxLength={300} placeholder="Sheboygan, WI" className={inputClass} />
          </Field>
        </div>
      </Group>

      <Group title="Availability and experience">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="availability" label="Availability" hint="Weekdays, overnights, weekends, etc.">
            <Input id="availability" name="availability" maxLength={200} aria-describedby="availability-hint" className={inputClass} />
          </Field>
          <Field id="startDate" label="Earliest start date" hint="Immediately, or a date.">
            <Input id="startDate" name="startDate" maxLength={120} aria-describedby="startDate-hint" className={inputClass} />
          </Field>
          <Field id="yearsExperience" label="Relevant experience" hint="For example, 3 years in long-term care.">
            <Input id="yearsExperience" name="yearsExperience" maxLength={120} aria-describedby="yearsExperience-hint" className={inputClass} />
          </Field>
          <Field id="desiredPay" label="Desired pay" hint="Optional.">
            <Input id="desiredPay" name="desiredPay" maxLength={120} aria-describedby="desiredPay-hint" className={inputClass} />
          </Field>
        </div>
      </Group>

      <Group title="About you">
        <Field id="coverLetter" label="Tell us about yourself" hint="A short note to the hiring team. What draws you to this role?">
          <Textarea id="coverLetter" name="coverLetter" rows={5} maxLength={4000} aria-describedby="coverLetter-hint" className="min-h-32 text-base" />
        </Field>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="resume-upload" className="text-sm font-medium">
            Resume
          </Label>
          {resume ? (
            <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <span className="inline-flex min-w-0 items-center gap-2 text-sm text-foreground">
                <FileTextIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{resume.filename}</span>
              </span>
              <button
                type="button"
                onClick={clearResume}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${resume.filename}`}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="resume-upload"
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/40"
              }`}
            >
              {uploading ? (
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              ) : (
                <UploadIcon className="size-6 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-sm font-medium text-foreground">{uploading ? "Uploading..." : "Choose a file or drag it here"}</span>
              <span className="text-sm text-muted-foreground">PDF or Word document, up to 8MB. Optional, but recommended.</span>
              <input
                ref={fileInputRef}
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={uploading}
                className="sr-only"
              />
            </label>
          )}
          {uploadError ? (
            <p role="alert" className="text-sm text-destructive">
              {uploadError}
            </p>
          ) : null}
        </div>

        <Field id="referralSource" label="How did you hear about us?" hint="Optional.">
          <Input id="referralSource" name="referralSource" maxLength={200} aria-describedby="referralSource-hint" className={inputClass} />
        </Field>
      </Group>

      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-5 border-t border-border pt-6">
        <label className="flex min-h-11 items-start gap-3 text-sm leading-relaxed text-foreground">
          <input name="eligibleToWork" type="checkbox" required className="mt-0.5 size-5 shrink-0 rounded border-input accent-primary" />
          <span>
            I am legally eligible to work in the United States.{" "}
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </span>
        </label>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending || uploading} className="h-12 w-full text-base sm:w-auto sm:self-start sm:px-10">
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
              Sending application...
            </>
          ) : (
            "Submit application"
          )}
        </Button>
      </div>
    </form>
  )
}
