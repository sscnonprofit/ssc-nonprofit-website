export const EMAIL_TIME_ZONE = "America/Chicago"

/**
 * Resend only delivers from a verified domain. Until one is verified, the
 * shared onboarding sender works for testing but can only reach the Resend
 * account owner. Set EMAIL_FROM once the SSC domain is verified.
 */
export function fromAddress() {
  return process.env.EMAIL_FROM || process.env.CONTACT_FROM_EMAIL || "Sheboygan Senior Community <onboarding@resend.dev>"
}

export function replyToAddress() {
  return process.env.EMAIL_REPLY_TO || undefined
}

/** Inbox for staff alerts (new inquiries, applications, RSVPs). */
export function staffInbox() {
  return process.env.STAFF_NOTIFY_EMAIL || process.env.CONTACT_TO_EMAIL || ""
}

export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL
  if (explicit) return explicit.replace(/\/$/, "")
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.V0_RUNTIME_URL) return process.env.V0_RUNTIME_URL.replace(/\/$/, "")
  return "http://localhost:3000"
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}
