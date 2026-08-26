import Image from "next/image"

type Member = {
  name: string
  role: string
  image: string
}

export function TeamGrid({ members }: { members: Member[] }) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
      {members.map((m) => (
        <li key={m.name} className="flex flex-col">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-muted">
            <Image
              src={m.image || "/placeholder.svg"}
              alt={m.name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              className="object-cover object-top"
            />
          </div>
          <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground">{m.name}</h3>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{m.role}</p>
        </li>
      ))}
    </ul>
  )
}
