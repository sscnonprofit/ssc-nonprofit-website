export const EXHIBITION_STATUSES = ["draft", "open", "upcoming", "active", "closed", "archived"] as const
export type ExhibitionStatus = (typeof EXHIBITION_STATUSES)[number]

export const EXHIBITION_STATUS_OPTIONS: { value: ExhibitionStatus; label: string; hint: string }[] = [
  { value: "draft", label: "Draft", hint: "Hidden from the public site." },
  { value: "open", label: "Open call", hint: "Listed publicly and accepting artwork submissions." },
  { value: "upcoming", label: "Upcoming", hint: "Listed publicly; submissions are closed." },
  { value: "active", label: "On view", hint: "Currently showing." },
  { value: "closed", label: "Closed", hint: "Still listed as a past exhibition." },
  { value: "archived", label: "Archived", hint: "Hidden from the public site." },
]

export const PUBLIC_EXHIBITION_STATUSES: ExhibitionStatus[] = ["open", "upcoming", "active", "closed"]

export const SUBMISSION_STATUSES = [
  { value: "submitted", label: "New" },
  { value: "under_review", label: "In review" },
  { value: "accepted", label: "Accepted" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "declined", label: "Declined" },
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]["value"]

export function isExhibitionStatus(value: unknown): value is ExhibitionStatus {
  return typeof value === "string" && (EXHIBITION_STATUSES as readonly string[]).includes(value)
}

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return typeof value === "string" && SUBMISSION_STATUSES.some((item) => item.value === value)
}

export function exhibitionStatusLabel(status: string) {
  return EXHIBITION_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status
}

export function submissionStatusLabel(status: string) {
  return SUBMISSION_STATUSES.find((item) => item.value === status)?.label ?? status
}

export type ExhibitionForm = {
  title: string
  slug: string
  description: string
  coverUrl: string
  venueName: string
  venueAddress: string
  venuePhone: string
  venueEmail: string
  venueWebsite: string
  startsAt: string
  endsAt: string
  publicOpeningAt: string
  submissionDeadline: string
  status: string
  featured: boolean
  submissionsEnabled: boolean
  albumIds: number[]
}

export type AdminExhibition = {
  id: number
  slug: string
  title: string
  description: string
  coverUrl: string | null
  venueName: string
  status: string
  featured: boolean
  submissionsEnabled: boolean
  startsAt: string | null
  endsAt: string | null
  submissionDeadline: string | null
  submissionCount: number
  pendingCount: number
  acceptedCount: number
  albumCount: number
  form: ExhibitionForm
}

export type AlbumOption = { id: number; title: string; status: string }
