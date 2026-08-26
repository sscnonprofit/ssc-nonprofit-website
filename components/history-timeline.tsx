import Image from "next/image"

type Milestone = {
  years: string
  title: string
  body: string
  image: string
}

export function HistoryTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="flex flex-col gap-12 md:gap-0">
      {milestones.map((m, i) => (
        <li
          key={m.years}
          className="relative flex flex-col gap-6 md:grid md:grid-cols-2 md:gap-12 md:pb-16"
        >
          {/* Center spine on desktop */}
          <span
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border md:block"
            aria-hidden="true"
          />
          <span
            className="absolute left-1/2 top-2 hidden size-3 -translate-x-1/2 rounded-full bg-accent ring-4 ring-background md:block"
            aria-hidden="true"
          />

          <div className={i % 2 === 0 ? "md:pr-12" : "md:order-2 md:pl-12"}>
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">{m.years}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">{m.title}</h3>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{m.body}</p>
          </div>

          <div className={i % 2 === 0 ? "md:pl-12" : "md:order-1 md:pr-12"}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
              <Image
                src={m.image || "/placeholder.svg"}
                alt={`${m.title}, ${m.years}`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
