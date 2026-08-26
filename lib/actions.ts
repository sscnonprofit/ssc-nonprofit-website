"use server"

import siteFallback from "@/content/site.json"
import { getContent } from "@/lib/cms/content"

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

/**
 * Sends mail through the Resend REST API. Returns false (without throwing) when
 * the environment is not configured, so the UI can fall back to phone/email.
 */
async function sendMail({ subject, html, replyTo }: { subject: string; html: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL
  const to = process.env.CONTACT_TO_EMAIL

  if (!apiKey || !from || !to) {
    console.log("[v0] Resend is not configured — skipping send. Missing RESEND_API_KEY, CONTACT_FROM_EMAIL or CONTACT_TO_EMAIL.")
    return false
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  if (!res.ok) {
    console.log("[v0] Resend send failed:", res.status, await res.text())
    throw new Error("Email delivery failed")
  }

  return true
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

  try {
    const sent = await sendMail({
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

    if (!sent) {
      return { status: "error", message: await unconfiguredMessage(), values }
    }

    return {
      status: "success",
      message: "Thank you. We've received your message and someone from our team will be in touch shortly.",
    }
  } catch {
    return { status: "error", message: await unconfiguredMessage(), values }
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

  try {
    const sent = await sendMail({
      subject: `Newsletter signup — ${email}`,
      replyTo: email,
      html: `<p>New newsletter signup: <strong>${escapeHtml(email)}</strong></p>`,
    })

    if (!sent) {
      return { status: "error", message: await unconfiguredMessage() }
    }

    return { status: "success", message: "You're on the list. Thank you for subscribing." }
  } catch {
    return { status: "error", message: await unconfiguredMessage() }
  }
}
