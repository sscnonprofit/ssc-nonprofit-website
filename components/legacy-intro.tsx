import Image from "next/image"
import { ArrowDown, ArrowUpRight } from "lucide-react"

export function LegacyIntro() {
  return (
    <section aria-labelledby="legacy-title" className="px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-3xl bg-primary text-primary-foreground lg:flex-row">
        <div className="flex flex-1 flex-col items-start gap-6 px-6 py-9 sm:px-10 sm:py-12 lg:justify-center lg:px-14 lg:py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">A future shaped by kindness</p>
          <h1 id="legacy-title" className="text-balance font-display text-5xl font-semibold leading-none tracking-tight sm:text-6xl lg:text-7xl">
            Leave a Legacy<span className="text-accent">.</span>
          </h1>
          <p className="max-w-md text-pretty font-display text-xl leading-snug sm:text-2xl">
            A gift of care today.<br />A sense of home for generations.
          </p>
          <p className="max-w-md text-pretty text-base leading-relaxed text-primary-foreground/80">
            Your generosity helps Sheboygan Senior Community remain a place of compassion, dignity, and belonging. Find a way to give that feels right for you.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
            <a href="#giving-options" className="ssc-btn-accent min-h-12 w-full sm:w-auto">
              Explore ways to give
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
            <a href="#legacy-contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-primary-foreground underline-offset-4 hover:underline focus-visible:outline-primary-foreground sm:justify-start">
              Let&apos;s talk
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="relative h-52 shrink-0 sm:h-72 lg:h-auto lg:min-h-128 lg:w-2/5">
          <Image
            src="/images/Sheboygan-Senior-Community_Community_1.jpg"
            alt="A smiling SSC resident enjoying a card game with a companion"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 460px"
            className="object-cover object-[center_36%] lg:object-center"
          />
        </div>
      </div>
    </section>
  )
}
