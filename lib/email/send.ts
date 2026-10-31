import { db } from "@/lib/db"
import { emailLog } from "@/lib/db/schema"

import { fromAddress, replyToAddress } from "./config"

export type EmailAttachment = {
  filename: string
  /** Raw text or bytes; encoded to base64 for Resend. */
  content: string | Buffer
  contentType?: string
}

export type SendEmailInput = {
  /** Short machine label recorded in the audit log, e.g. "rsvp-confirmation". */
  kind: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  /** Prevents duplicate sends if a job is retried. */
  idempotencyKey?: string
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string }

async function record(entry: { kind: string; recipient: string; subject: string; status: string; providerId?: string; error?: string }) {
  try {
    await db.insert(emailLog).values({
      kind: entry.kind,
      recipient: entry.recipient.slice(0, 250),
      subject: entry.subject.slice(0, 250),
      status: entry.status,
      providerId: entry.providerId ?? null,
      error: entry.error?.slice(0, 500) ?? null,
    })
  } catch (error) {
    console.log("[v0] Failed to write email log:", error)
  }
}

/**
 * The single entry point for all SSC email. Never throws: callers decide
 * whether a failed send matters. Every attempt is recorded in email_log.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean)
  const recipientLabel = recipients.join(", ")
  const apiKey = process.env.RESEND_API_KEY

  if (!recipients.length) return { ok: false, error: "No recipient." }
  if (!apiKey) {
    await record({ kind: input.kind, recipient: recipientLabel, subject: input.subject, status: "skipped", error: "RESEND_API_KEY is not set" })
    return { ok: false, error: "Email is not configured." }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo ?? replyToAddress(),
        headers: input.headers,
        attachments: input.attachments?.map((file) => ({
          filename: file.filename,
          content: Buffer.from(file.content).toString("base64"),
          ...(file.contentType ? { content_type: file.contentType } : {}),
        })),
      }),
    })

    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!response.ok || !body.id) {
      const error = body.message || `Resend responded with ${response.status}`
      console.log("[v0] Resend send failed:", response.status, error)
      await record({ kind: input.kind, recipient: recipientLabel, subject: input.subject, status: "failed", error })
      return { ok: false, error }
    }

    await record({ kind: input.kind, recipient: recipientLabel, subject: input.subject, status: "sent", providerId: body.id })
    return { ok: true, id: body.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error"
    console.log("[v0] Resend request error:", message)
    await record({ kind: input.kind, recipient: recipientLabel, subject: input.subject, status: "failed", error: message })
    return { ok: false, error: message }
  }
}
