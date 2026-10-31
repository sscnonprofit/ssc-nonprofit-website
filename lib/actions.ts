"use server"

import siteFallback from "@/content/site.json"
import { getContent } from "@/lib/cms/content"
import { db } from "@/lib/db"
import { contactMessages } from "@/lib/db/schema"
import { staffInbox } from "@/lib/email/config"
import { sendEmail } from "@/lib/email/send"
import { inquiryReceivedEmail, newsletterWelcomeEmail } from "@/lib/email/templates"

export type FormState = {
  status: "idle" | "success" | "error"
  message: string
  fieldErrors?: Record<string, string>
  /** Echoed back on error so the form repopulates instead of losing input. */
  values?: Record<string, string>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: FormDataEntryValue | null, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Staff alert via Resend. Returns false (without throwing) so the UI can fall back to phone/email. */
async function sendMail({ subject, html, replyTo }: { subject: string; html: string; replyTo?: string }) {
  const to = staffInbox()
  if (!to) {
    console.log("[v0] No staff inbox configured — set STAFF_NOTIFY_EMAIL.")
    return false
  }
  const result = await sendEmail({ kind: "staff-notification", to, subject, html, replyTo })
  return result.ok
}

/** Persists a submission so it is never lost when email is unavailable. */
async function saveMessage(input: {
  kind: "contact" | "newsletter"
  name: string
  email: string
  phone: string
  topic: string
  message: string
}) {
  try {
    await db.insert(contactMessages).values(input)
    return true
  } catch (error) {
    console.log("[v0] Failed to save contact message:", error)
    return false
  }
}

async function unconfiguredMessage() {
  const site = await getContent("site", siteFallback)
  return `We couldn't send your message just now. Please call us at ${site.phone} and we'll be glad to help right away.`
}

export async function submitContactForm(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot — silently accept bot submissions.
  if (clean(formData.get("company"))) {
    return { status: "success", message: "Thank you. Your message has been sent." }
  }

  const name = clean(formData.get("name"), 120)
  const email = clean(formData.get("email"), 200)
  const phone = clean(formData.get("phone"), 40)
  const topic = clean(formData.get("topic"), 80)
  const message = clean(formData.get("message"), 4000)

  const values = { name, email, phone, topic, message }

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = "Please tell us your name."
  if (!email) fieldErrors.email = "Please enter your email address."
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address."
  if (!message) fieldErrors.message = "Please enter a message."

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors, values }
  }

  const saved = await saveMessage({ kind: "contact", name, email, phone, topic, message })

  let emailed = false
  try {
    emailed = await sendMail({
      subject: `Website enquiry${topic ? ` — ${topic}` : ""} from ${name}`,
      replyTo: email,
      html: `
        <h2>New website enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone) || "—"}</p>
        <p><strong>Interested in:</strong> ${escapeHtml(topic) || "—"}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      `,
    })
  } catch {
    emailed = false
  }

  if (!saved && !emailed) {
    return { status: "error", message: await unconfiguredMessage(), values }
  }

  await sendEmail({ kind: "inquiry-received", to: email, ...inquiryReceivedEmail({ name, topic }) })

  return {
    status: "success",
    message: "Thank you. We've received your message and someone from our team will be in touch shortly.",
  }
}

export async function submitNewsletterForm(_prev: FormState, formData: FormData): Promise<FormState> {
  if (clean(formData.get("company"))) {
    return { status: "success", message: "Thank you for subscribing." }
  }

  const email = clean(formData.get("email"), 200)

  if (!email || !EMAIL_RE.test(email)) {
    return {
      status: "error",
      message: "Please enter a valid email address.",
      fieldErrors: { email: "Please enter a valid email address." },
    }
  }

  const saved = await saveMessage({ kind: "newsletter", name: "", email, phone: "", topic: "Newsletter signup", message: "" })

  let emailed = false
  try {
    emailed = await sendMail({
      subject: `Newsletter signup — ${email}`,
      replyTo: email,
      html: `<p>New newsletter signup: <strong>${escapeHtml(email)}</strong></p>`,
    })
  } catch {
    emailed = false
  }

  if (!saved && !emailed) {
    return { status: "error", message: await unconfiguredMessage() }
  }

  await sendEmail({ kind: "newsletter-welcome", to: email, ...newsletterWelcomeEmail() })

  return { status: "success", message: "You're on the list. Thank you for subscribing." }
}
