"use client"

import { useActionState } from "react"

import { submitNewsletterForm, type FormState } from "@/lib/actions"
import { Button } from "@/components/ui/button"

const initialState: FormState = { status: "idle", message: "" }

/**
 * `onDark` renders the form for the wine-coloured footer; the default styling
 * is for light card surfaces.
 */
export function NewsletterForm({ onDark = false }: { onDark?: boolean }) {
  const [state, formAction, pending] = useActionState(submitNewsletterForm, initialState)

  const inputClass = onDark
    ? "h-11 w-full rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 text-base text-primary-foreground outline-none placeholder:text-primary-foreground/50 focus-visible:border-primary-foreground/60 focus-visible:ring-[3px] focus-visible:ring-primary-foreground/20"
    : "h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"

  const buttonClass = onDark ? "h-11 bg-accent text-accent-foreground hover:bg-accent/90" : "h-11"

  const id = onDark ? "newsletter-email-footer" : "newsletter-email"

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <div className="flex-1">
          <label htmlFor={id} className="sr-only">
            Email address
          </label>
          <input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className={inputClass}
          />
        </div>

        {/* Honeypot field for bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label htmlFor={`${id}-company`}>Company</label>
          <input id={`${id}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>

      {state.message && (
        <p
          role="status"
          className={`mt-3 text-sm leading-relaxed ${
            onDark
              ? state.status === "success"
                ? "text-primary-foreground"
                : "text-accent"
              : state.status === "success"
                ? "text-primary"
                : "text-destructive"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  )
}
