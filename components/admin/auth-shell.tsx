import Image from "next/image"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md border-border bg-card shadow-2xl shadow-primary/10">
        <CardHeader className="gap-4 px-6 pt-8 sm:px-8">
          <Image src="/images/ssc-logo.png" alt="Sheboygan Senior Community" width={175} height={53} quality={100} sizes="176px" className="h-auto w-44 object-contain" priority />
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">Staff portal</p>
            <CardTitle className="font-serif text-3xl tracking-tight">{title}</CardTitle>
            <CardDescription className="mt-2 text-sm leading-6">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-8 sm:px-8">{children}</CardContent>
      </Card>
    </main>
  )
}
