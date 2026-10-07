import Link from "next/link"

import { listPublicExhibitions } from "@/lib/gallery/exhibitions"

export const metadata = { title: "Gallery Exhibitions", description: "Discover exhibitions, artists, and collections at Sheboygan Senior Community." }

export default async function ExhibitionsPage() {
  const exhibitions = await listPublicExhibitions()
  return <section className="mx-auto max-w-7xl px-6 py-16"><div className="max-w-2xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Artists Gallery</p><h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-6xl">Gallery exhibitions</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Discover the artists and collections being celebrated across our community.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{exhibitions.map((exhibition) => <Link key={exhibition.id} href={`/artists-gallery/exhibitions/${exhibition.slug}`} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">{exhibition.coverUrl ? <img src={exhibition.coverUrl} alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="aspect-[4/3] bg-primary/10" />}<div className="p-6"><div className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{exhibition.status}</div><h2 className="mt-2 font-display text-2xl font-semibold">{exhibition.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{exhibition.description}</p></div></Link>)}</div></section>
}
