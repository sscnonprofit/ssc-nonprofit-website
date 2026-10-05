"use client"

import type React from "react"

import Image from "next/image"
import { Loader2Icon, LockIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function AdminAuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === "sign-up"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.")
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <main className="min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100svh-5rem)]">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-10">
            <div className="relative z-10 flex items-center gap-3">
              <Image src="/images/ssc-logo.png" alt="Sheboygan Senior Community" width={190} height={57} className="h-auto w-48 brightness-0 invert" priority />
            </div>
            <div className="relative z-10 max-w-sm">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Content workspace</p>
              <h2 className="text-balance font-serif text-4xl leading-tight">Carefully shape the story of community.</h2>
              <p className="mt-4 text-sm leading-6 text-primary-foreground/75">
                Manage pages, events, galleries, and the everyday details that help families feel at home.
              </p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-xs text-primary-foreground/70">
              <ShieldCheckIcon className="size-4" /> Secure staff access
            </div>
            <div aria-hidden className="absolute -bottom-24 -right-20 size-72 rounded-full border border-primary-foreground/15" />
            <div aria-hidden className="absolute -bottom-12 -right-8 size-48 rounded-full border border-primary-foreground/10" />
          </section>

          <Card className="rounded-none border-0 bg-card shadow-none">
            <CardHeader className="gap-5 px-6 pb-4 pt-8 sm:px-10 sm:pt-10">
              <div className="flex items-center justify-between gap-4 lg:hidden">
                <Image src="/images/ssc-logo.png" alt="Sheboygan Senior Community" width={175} height={53} className="h-auto w-44" priority />
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <LockIcon className="size-5" />
                </div>
              </div>
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">Staff portal</p>
                <CardTitle className="font-serif text-3xl tracking-tight sm:text-4xl">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </CardTitle>
                <CardDescription className="mt-2 max-w-md text-sm leading-6">
                  {isSignUp
                    ? "The first account created becomes the site administrator."
                    : "Sign in to manage Sheboygan Senior Community's site content."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-8 sm:px-10 sm:pb-10">
              <form onSubmit={handleSubmit}>
                <FieldGroup className="gap-5">
                  {isSignUp && (
                    <Field>
                      <FieldLabel htmlFor="name">Full name</FieldLabel>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-12 bg-background text-base" placeholder="Your name" />
                    </Field>
                  )}
                  <Field>
                    <FieldLabel htmlFor="email">Work email</FieldLabel>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 bg-background text-base" placeholder="you@sscnonprofit.org" />
                  </Field>
                  <Field>
                    <div className="flex items-center justify-between gap-3">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      {!isSignUp && <span className="text-xs text-muted-foreground">8+ characters</span>}
                    </div>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} className="h-12 bg-background text-base" placeholder="Enter your password" />
                  </Field>

                  {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm leading-5 text-destructive" role="alert">{error}</p>}

                  <Button type="submit" disabled={loading} className="h-12 w-full text-sm font-semibold shadow-sm">
                    {loading ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
                    {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in to CMS"}
                  </Button>
                </FieldGroup>
              </form>

              <div className="mt-8 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                {isSignUp ? "Already have an account? " : "Need an account? "}
                <Link href={isSignUp ? "/admin/sign-in" : "/admin/sign-up"} className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline">
                  {isSignUp ? "Sign in" : "Sign up"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
