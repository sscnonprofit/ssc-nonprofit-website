"use client"

import { useActionState } from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"

import { submitContactForm, type FormState } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialState: FormState = { status: "idle", message: "" }

const TOPICS = ["Assisted Living", "Short Term Rehab", "Skilled Nursing", "Careers", "Donations", "Something else"]

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialState)

  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-semibold">Message sent</h3>
        <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{state.message}</p>
      </div>
    )
  }

  return (
    <form
      key={state.values ? [state.values.name, state.values.email, state.values.phone, state.values.topic, state.values.message].join("|") : "initial"}
      action={formAction}
      className="flex flex-col gap-5"
      noValidate
    >
      {state.status === "error" && state.message && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="text-pretty leading-relaxed">{state.message}</p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
          />
          {state.fieldErrors?.name && (
            <p id="name-error" className="text-sm text-destructive">
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="text-sm text-destructive">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone ?? ""} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="topic">I&apos;m interested in</Label>
          <select
            id="topic"
            name="topic"
            defaultValue={state.values?.topic ?? ""}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Select a topic</option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="message">
          How can we help? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={6}
          defaultValue={state.values?.message ?? ""}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
          aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
        />
        {state.fieldErrors?.message && (
          <p id="message-error" className="text-sm text-destructive">
            {state.fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot field for bots — hidden from users and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
        <p className="text-sm text-muted-foreground">We typically reply within one business day.</p>
      </div>
    </form>
  )
}
