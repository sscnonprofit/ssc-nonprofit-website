import Link from "next/link"
import { CheckIcon, ClockIcon, MailIcon, MapPinIcon, PhoneIcon, QuoteIcon } from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { CustomBlock } from "@/lib/builder/custom-block"
import { Editable, RichText } from "@/lib/builder/editable"
import { toEmbedUrl } from "@/lib/builder/embed"
import type { Section } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"

type Props = Record<string, unknown>
type Item = Record<string, string>

const s = (props: Props, key: string) => (typeof props[key] === "string" ? (props[key] as string) : "")
const list = (props: Props, key: string) => (Array.isArray(props[key]) ? (props[key] as Item[]) : [])

function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (!src) return <div className={cn("bg-muted", className)} aria-hidden="true" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cn("object-cover", className)} />
}

function Btn({ props, prefix, kind }: { props: Props; prefix: string; kind: "primary" | "secondary" | "accent" }) {
  const label = s(props, `${prefix}Label`)
  const href = s(props, `${prefix}Href`) || "#"
  if (!label) return null
  const className = kind === "primary" ? "ssc-btn" : kind === "accent" ? "ssc-btn-accent" : "ssc-btn-secondary"
  const external = /^https?:\/\//.test(href)
  return (
    <Link
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <Editable path={`${prefix}Label`} value={label} placeholder="Button" />
    </Link>
  )
}

function Heading({ props, align, level = "h2" }: { props: Props; align: "left" | "center"; level?: "h1" | "h2" }) {
  const center = align === "center"
  return (
    <div className={cn("flex flex-col gap-3", center && "items-center text-center")}>
      <Editable path="eyebrow" value={s(props, "eyebrow")} as="p" className="ssc-eyebrow" placeholder="Eyebrow" />
      <Editable
        path="title"
        value={s(props, "title")}
        as={level}
        className={cn(level === "h1" ? "ssc-h1" : "ssc-h2", "text-balance text-foreground")}
        placeholder="Heading"
      />
    </div>
  )
}

function Hero({ section }: { section: Section }) {
  const { props, variant, style } = section
  const center = variant === "centered" || style.align === "center"
  const content = (
    <div className={cn("flex flex-col gap-6", center && "items-center text-center")}>
      <Heading props={props} align={center ? "center" : "left"} level="h1" />
      <Editable
        path="subtitle"
        value={s(props, "subtitle")}
        as="p"
        multiline
        className={cn("max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground", center && "mx-auto")}
        placeholder="Subheading"
      />
      <div className={cn("flex flex-wrap gap-3", center && "justify-center")}>
        <Btn props={props} prefix="primary" kind="primary" />
        <Btn props={props} prefix="secondary" kind="secondary" />
      </div>
    </div>
  )

  if (variant === "split") {
    return (
      <div className="grid items-center gap-10 @3xl:grid-cols-2 @3xl:gap-14">
        {content}
        <Img src={s(props, "image")} alt={s(props, "imageAlt")} className="aspect-[4/3] w-full rounded-2xl" />
      </div>
    )
  }

  if (variant === "centered" && s(props, "image")) {
    return (
      <div className="flex flex-col gap-12">
        {content}
        <Img src={s(props, "image")} alt={s(props, "imageAlt")} className="aspect-[21/9] w-full rounded-2xl" />
      </div>
    )
  }

  return content
}

function RichTextBlock({ section }: { section: Section }) {
  const { props, variant, style } = section
  if (variant === "split") {
    return (
      <div className="grid gap-8 @3xl:grid-cols-[2fr_3fr] @3xl:gap-16">
        <Heading props={props} align="left" />
        <RichText path="body" value={s(props, "body")} className="text-pretty leading-relaxed text-muted-foreground" />
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col gap-6", style.align === "center" && "items-center text-center")}>
      <Heading props={props} align={style.align} />
      <RichText path="body" value={s(props, "body")} className="text-pretty leading-relaxed text-muted-foreground" />
    </div>
  )
}

function ImageText({ section }: { section: Section }) {
  const { props, variant } = section
  const bullets = list(props, "bullets")
  return (
    <div className="grid items-center gap-10 @3xl:grid-cols-2 @3xl:gap-16">
      <Img
        src={s(props, "image")}
        alt={s(props, "imageAlt")}
        className={cn("aspect-[4/3] w-full rounded-2xl", variant === "imageRight" && "@3xl:order-last")}
      />
      <div className="flex flex-col gap-6">
        <Heading props={props} align="left" />
        <RichText path="body" value={s(props, "body")} className="leading-relaxed text-muted-foreground" />
        {bullets.length > 0 && (
          <ul className="flex flex-col gap-3">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3" aria-hidden="true" />
                </span>
                <Editable path={`bullets.${i}.text`} value={b.text ?? ""} className="text-foreground" />
              </li>
            ))}
          </ul>
        )}
        <div>
          <Btn props={props} prefix="button" kind="primary" />
        </div>
      </div>
    </div>
  )
}

const colClass: Record<string, string> = {
  "2": "@3xl:grid-cols-2",
  "3": "@3xl:grid-cols-2 @5xl:grid-cols-3",
  "4": "@xl:grid-cols-2 @5xl:grid-cols-4",
}

function Features({ section }: { section: Section }) {
  const { props, variant, style } = section
  const items = list(props, "items")
  return (
    <div className="flex flex-col gap-10">
      <div className={cn("flex flex-col gap-4", style.align === "center" && "items-center text-center")}>
        <Heading props={props} align={style.align} />
        <Editable path="intro" value={s(props, "intro")} as="p" multiline className="max-w-2xl text-muted-foreground" placeholder="Intro" />
      </div>
      <div className={cn("grid gap-6", colClass[variant] ?? colClass["3"])}>
        {items.map((item, i) => (
          <article key={i} className="ssc-card flex flex-col overflow-hidden">
            {item.image && <Img src={item.image} alt="" className="aspect-[16/10] w-full" />}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <Editable path={`items.${i}.title`} value={item.title ?? ""} as="h3" className="ssc-h3 text-foreground" placeholder="Title" />
              <Editable path={`items.${i}.body`} value={item.body ?? ""} as="p" multiline className="leading-relaxed text-muted-foreground" placeholder="Text" />
              {item.linkLabel && (
                <Link href={item.href || "#"} className="mt-auto pt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  <Editable path={`items.${i}.linkLabel`} value={item.linkLabel} />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Stats({ section }: { section: Section }) {
  const { props, variant, style } = section
  const items = list(props, "items")
  return (
    <div className={cn("flex flex-col gap-10", style.align === "center" && "items-center text-center")}>
      <Editable path="title" value={s(props, "title")} as="h2" className="ssc-h2 text-balance text-foreground" placeholder="Heading (optional)" />
      <dl className="grid w-full grid-cols-2 gap-6 @3xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {items.map((item, i) => (
          <div key={i} className={cn("flex flex-col gap-1", variant === "cards" && "ssc-card p-6")}>
            <Editable path={`items.${i}.value`} value={item.value ?? ""} as="dt" className="font-display text-4xl font-bold text-foreground @3xl:text-5xl" placeholder="00" />
            <Editable path={`items.${i}.label`} value={item.label ?? ""} as="dd" className="text-sm text-muted-foreground" placeholder="Label" />
          </div>
        ))}
      </dl>
    </div>
  )
}

function Cta({ section }: { section: Section }) {
  const { props, variant, style } = section
  const center = style.align === "center"
  const inner = (
    <div className={cn("flex flex-col gap-5", center && "items-center text-center")}>
      <Editable path="title" value={s(props, "title")} as="h2" className="ssc-h2 max-w-3xl text-balance text-foreground" placeholder="Heading" />
      <Editable path="body" value={s(props, "body")} as="p" multiline className="max-w-2xl text-lg text-muted-foreground" placeholder="Text" />
      <div className={cn("flex flex-wrap gap-3 pt-2", center && "justify-center")}>
        <Btn props={props} prefix="primary" kind="primary" />
        <Btn props={props} prefix="secondary" kind="secondary" />
      </div>
    </div>
  )
  if (variant === "card") return <div className="ssc-card p-8 @3xl:p-14">{inner}</div>
  return inner
}

function Gallery({ section }: { section: Section }) {
  const { props, variant, style } = section
  const images = list(props, "images")
  return (
    <div className="flex flex-col gap-10">
      <Heading props={props} align={style.align} />
      {variant === "masonry" ? (
        <div className="columns-1 gap-4 @xl:columns-2 @5xl:columns-3">
          {images.map((img, i) => (
            <figure key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img.image ? <img src={img.image} alt={img.alt ?? ""} loading="lazy" className="w-full" /> : <div className="aspect-square bg-muted" />}
              <Editable path={`images.${i}.caption`} value={img.caption ?? ""} as="figcaption" className="pt-2 text-sm text-muted-foreground" placeholder="Caption" />
            </figure>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-3">
          {images.map((img, i) => (
            <figure key={i} className="flex flex-col gap-2">
              <Img src={img.image ?? ""} alt={img.alt ?? ""} className="aspect-square w-full rounded-xl" />
              <Editable path={`images.${i}.caption`} value={img.caption ?? ""} as="figcaption" className="text-sm text-muted-foreground" placeholder="Caption" />
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}

function Person({ image, name }: { image?: string; name?: string }) {
  if (image) return <Img src={image} alt={name ?? ""} className="size-12 shrink-0 rounded-full" />
  const initials = (name ?? "")
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary" aria-hidden="true">
      {initials}
    </span>
  )
}

function Testimonials({ section }: { section: Section }) {
  const { props, variant, style } = section
  const items = list(props, "items")
  if (variant === "featured" && items[0]) {
    const item = items[0]
    return (
      <figure className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <QuoteIcon className="size-10 text-primary" aria-hidden="true" />
        <Editable path="items.0.quote" value={item.quote ?? ""} as="blockquote" multiline className="font-display text-2xl leading-snug text-balance text-foreground @3xl:text-3xl" placeholder="Quote" />
        <figcaption className="flex items-center gap-3 text-left">
          <Person image={item.image} name={item.name} />
          <span className="flex flex-col">
            <Editable path="items.0.name" value={item.name ?? ""} className="font-semibold text-foreground" placeholder="Name" />
            <Editable path="items.0.role" value={item.role ?? ""} className="text-sm text-muted-foreground" placeholder="Role" />
          </span>
        </figcaption>
      </figure>
    )
  }
  return (
    <div className="flex flex-col gap-10">
      <Heading props={props} align={style.align} />
      <div className="grid gap-6 @3xl:grid-cols-2 @5xl:grid-cols-3">
        {items.map((item, i) => (
          <figure key={i} className="ssc-card flex flex-col gap-6 p-6">
            <Editable path={`items.${i}.quote`} value={item.quote ?? ""} as="blockquote" multiline className="leading-relaxed text-foreground" placeholder="Quote" />
            <figcaption className="mt-auto flex items-center gap-3">
              <Person image={item.image} name={item.name} />
              <span className="flex flex-col">
                <Editable path={`items.${i}.name`} value={item.name ?? ""} className="font-semibold text-foreground" placeholder="Name" />
                <Editable path={`items.${i}.role`} value={item.role ?? ""} className="text-sm text-muted-foreground" placeholder="Role" />
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function Team({ section }: { section: Section }) {
  const { props, variant, style } = section
  const items = list(props, "items")
  return (
    <div className="flex flex-col gap-10">
      <Heading props={props} align={style.align} />
      {variant === "compact" ? (
        <ul className="grid gap-4 @3xl:grid-cols-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-4 border-b border-border pb-4">
              <Person image={item.image} name={item.name} />
              <span className="flex flex-col">
                <Editable path={`items.${i}.name`} value={item.name ?? ""} className="font-semibold text-foreground" placeholder="Name" />
                <Editable path={`items.${i}.role`} value={item.role ?? ""} className="text-sm text-muted-foreground" placeholder="Role" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-1 gap-8 @xl:grid-cols-2 @5xl:grid-cols-3">
          {items.map((item, i) => (
            <article key={i} className="flex flex-col gap-3">
              <Img src={item.image ?? ""} alt={item.name ?? ""} className="aspect-[4/5] w-full rounded-2xl" />
              <Editable path={`items.${i}.name`} value={item.name ?? ""} as="h3" className="ssc-h3 text-foreground" placeholder="Name" />
              <Editable path={`items.${i}.role`} value={item.role ?? ""} as="p" className="ssc-eyebrow" placeholder="Role" />
              <Editable path={`items.${i}.bio`} value={item.bio ?? ""} as="p" multiline className="text-sm leading-relaxed text-muted-foreground" placeholder="Short bio" />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function Faq({ section }: { section: Section }) {
  const { props, variant, style } = section
  const items = list(props, "items")
  const questions = (
    <div className="flex flex-col divide-y divide-border border-y border-border">
      {items.map((item, i) => (
        <details key={i} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-foreground [&::-webkit-details-marker]:hidden">
            <Editable path={`items.${i}.question`} value={item.question ?? ""} placeholder="Question" />
            <span className="text-2xl leading-none text-primary transition-transform group-open:rotate-45" aria-hidden="true">
              +
            </span>
          </summary>
          <Editable path={`items.${i}.answer`} value={item.answer ?? ""} as="p" multiline className="pt-3 leading-relaxed text-muted-foreground" placeholder="Answer" />
        </details>
      ))}
    </div>
  )
  const head = (
    <div className={cn("flex flex-col gap-4", variant !== "split" && style.align === "center" && "items-center text-center")}>
      <Heading props={props} align={variant === "split" ? "left" : style.align} />
      <Editable path="intro" value={s(props, "intro")} as="p" multiline className="text-muted-foreground" placeholder="Intro" />
    </div>
  )
  if (variant === "split") {
    return (
      <div className="grid gap-10 @3xl:grid-cols-[2fr_3fr] @3xl:gap-16">
        {head}
        {questions}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-10">
      {head}
      {questions}
    </div>
  )
}

export { toEmbedUrl }

function Video({ section }: { section: Section }) {
  const { props, variant, style } = section
  const embed = toEmbedUrl(s(props, "url"))
  return (
    <div className="flex flex-col gap-8">
      <Heading props={props} align={style.align} />
      <div className={cn("w-full", variant === "contained" && "mx-auto max-w-4xl")}>
        {embed ? (
          <iframe
            src={embed}
            title={s(props, "title") || "Video"}
            className="aspect-video w-full rounded-2xl"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
            Add a YouTube or Vimeo link in the inspector
          </div>
        )}
        <Editable path="caption" value={s(props, "caption")} as="p" className="pt-3 text-sm text-muted-foreground" placeholder="Caption" />
      </div>
    </div>
  )
}

function Contact({ section }: { section: Section }) {
  const { props, variant } = section
  const phone = s(props, "phone")
  const email = s(props, "email")
  const rows = [
    { icon: MapPinIcon, path: "address", value: s(props, "address"), label: "Address" },
    { icon: PhoneIcon, path: "phone", value: phone, label: "Phone", href: phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined },
    { icon: MailIcon, path: "email", value: email, label: "Email", href: email ? `mailto:${email}` : undefined },
    { icon: ClockIcon, path: "hours", value: s(props, "hours"), label: "Hours" },
  ]
  const query = s(props, "mapQuery")
  return (
    <div className={cn("grid gap-10", variant === "map" && "@3xl:grid-cols-2 @3xl:gap-14")}>
      <div className="flex flex-col gap-6">
        <Heading props={props} align="left" />
        <Editable path="intro" value={s(props, "intro")} as="p" multiline className="text-muted-foreground" placeholder="Intro" />
        <dl className="flex flex-col gap-5">
          {rows.map(({ icon: Icon, path, value, label, href }) => (
            <div key={path} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <dt className="text-sm font-semibold text-foreground">{label}</dt>
                <dd className="text-muted-foreground">
                  {href ? (
                    <a href={href} className="hover:text-primary">
                      <Editable path={path} value={value} placeholder={label} />
                    </a>
                  ) : (
                    <Editable path={path} value={value} multiline placeholder={label} />
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
      {variant === "map" && query && (
        <iframe
          title={`Map of ${query}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          className="min-h-80 w-full rounded-2xl border border-border"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </div>
  )
}

function Spacer({ section }: { section: Section }) {
  if (section.variant === "line") return <hr className="border-border" />
  if (section.variant === "brand") return <BrandRule className="mx-auto" />
  return <div aria-hidden="true" />
}

export const BLOCK_COMPONENTS: Record<string, (p: { section: Section }) => React.ReactNode> = {
  hero: Hero,
  richText: RichTextBlock,
  imageText: ImageText,
  features: Features,
  stats: Stats,
  cta: Cta,
  gallery: Gallery,
  testimonials: Testimonials,
  team: Team,
  faq: Faq,
  video: Video,
  contact: Contact,
  spacer: Spacer,
  custom: CustomBlock,
}
