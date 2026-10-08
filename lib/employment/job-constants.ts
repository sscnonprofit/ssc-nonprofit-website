export const JOB_STATUSES = ["draft", "open", "closed", "archived"] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_STATUS_OPTIONS: { value: JobStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Hidden from the public site." },
  { value: "open", label: "Open", hint: "Listed publicly and accepting applications." },
  { value: "closed", label: "Closed", hint: "Still listed, but applications are closed." },
  { value: "archived", label: "Archived", hint: "Hidden from the public site." },
]

export const PUBLIC_JOB_STATUSES: JobStatus[] = ["open", "closed"]

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "per_diem", label: "Per diem" },
  { value: "seasonal", label: "Seasonal" },
  { value: "temporary", label: "Temporary" },
] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]["value"]

export const APPLICATION_STATUSES = [
  { value: "new", label: "New" },
  { value: "under_review", label: "In review" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer extended" },
  { value: "hired", label: "Hired" },
  { value: "declined", label: "Declined" },
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]["value"]

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && (JOB_STATUSES as readonly string[]).includes(value)
}

export function isEmploymentType(value: unknown): value is EmploymentType {
  return typeof value === "string" && EMPLOYMENT_TYPES.some((item) => item.value === value)
}

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && APPLICATION_STATUSES.some((item) => item.value === value)
}

export function jobStatusLabel(status: string) {
  return JOB_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

export function employmentTypeLabel(type: string) {
  return EMPLOYMENT_TYPES.find((item) => item.value === type)?.label ?? type
}

export function applicationStatusLabel(status: string) {
  return APPLICATION_STATUSES.find((item) => item.value === status)?.label ?? status
}

export type JobForm = {
  title: string
  slug: string
  department: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  benefits: string
  payRange: string
  status: string
  featured: boolean
  applicationsEnabled: boolean
  closingDate: string
  contactName: string
  contactEmail: string
}

export type AdminJob = {
  id: number
  slug: string
  title: string
  department: string
  location: string
  employmentType: string
  status: string
  featured: boolean
  applicationsEnabled: boolean
  closingDate: string | null
  applicationCount: number
  newCount: number
  hiredCount: number
  form: JobForm
}

export type PublicJob = {
  id: number
  slug: string
  title: string
  department: string
  location: string
  employmentType: string
  summary: string
  description: string
  requirements: string
  benefits: string
  payRange: string
  status: string
  featured: boolean
  applicationsEnabled: boolean
  closingDate: string | null
  contactName: string
  contactEmail: string
}
