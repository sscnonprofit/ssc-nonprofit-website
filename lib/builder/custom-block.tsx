import Link from "next/link"
import {
  CalendarIcon,
  CheckIcon,
  HeartHandshakeIcon,
  HeartIcon,
  HomeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SmileIcon,
  SparklesIcon,
  StarIcon,
  SunIcon,
  UsersIcon,
  UtensilsIcon,
  type LucideIcon,
} from "lucide-react"

import { BrandRule } from "@/components/brand-rule"
import { Editable } from "@/lib/builder/editable"
import type { CustomElement } from "@/lib/builder/elements"
import type { Section } from "@/lib/builder/schema"
import { cn } from "@/lib/utils"
import { toEmbedUrl } from "@/lib/builder/embed"

const ICONS: Record<string, LucideIcon> = {
  heart: HeartIcon,
  care: HeartHandshakeIcon,
  shield: ShieldCheckIcon,
  home: HomeIcon,
  meals: UtensilsIcon,
  users: UsersIcon,
  smile: SmileIcon,
  calendar: CalendarIcon,
  phone: PhoneIcon,
  sun: SunIcon,
  star: StarIcon,
  sparkles: SparklesIcon,
}

const SPAN_CLASS: Record<CustomElement["span"], string> = {
  full: "@3xl:col-span-6",
  half: "@3xl:col-span-3",
  third: "@3xl:col-span-2",
}

const ALIGN_CLASS = { left: "items-start text-left", center: "items-center text-center", right: "items-end text-right" } as const

const HEADING_SIZE: Record<CustomElement["size"], string> = {
  sm: "ssc-h3",
  md: "ssc-h2",
  lg: "ssc-h1",
  xl: "ssc-h1 @3xl:text-6xl",
}

const TEXT_SIZE: Record<CustomElement["size"], string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
}

const SPACER_SIZE: Record<CustomElement["size"], string> = { sm: "h-4", md: "h-8", lg: "h-14", xl: "h-24" }
const IMAGE_WIDTH: Record<CustomElement["size"], string> = { sm: "max-w-xs", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-none" }
const IMAGE_SHAPE: Record<string, string> = { auto: "", square: "aspect-square", landscape: "aspect-[4/3]", wide: "aspect-[21/9]" }

function ElementView({ el, index, align }: { el: CustomElement; index: number; align: "left" | "center" | "right" }) {
  const p = (field: string) => `elements.${index}.${field}`
  const resolved = el.align === "inherit" ? align : el.align

  switch (el.kind) {
    case "heading":
      return el.variant === "eyebrow" ? (
        <Editable path={p("text")} value={el.text} as="p" className="ssc-eyebrow" placeholder="Small label" />
      ) : (
        <Editable
          path={p("text")}
          value={el.text}
          as="h2"
          className={cn(HEADING_SIZE[el.size], "text-balance text-foreground")}
          placeholder="Heading"
        />
      )

    case "text":
      return (
        <Editable
          path={p("text")}
          value={el.text}
          as="p"
          multiline
          className={cn(TEXT_SIZE[el.size], "max-w-prose leading-relaxed text-muted-foreground")}
          placeholder="Write something"
        />
      )

    case "quote":
      return (
        <figure className="flex flex-col gap-3 border-l-4 border-accent pl-5">
          <Editable
            path={p("text")}
            value={el.text}
            as="blockquote"
            multiline
            className="font-serif text-xl leading-relaxed text-foreground"
            placeholder="Quote"
          />
          <figcaption className="text-sm font-semibold text-muted-foreground">
            <Editable path={p("text2")} value={el.text2} placeholder="Name or source" />
          </figcaption>
        </figure>
      )

    case "list": {
      const lines = el.items.split("\n").map((line) => line.trim()).filter(Boolean)
      const ordered = el.variant === "number"
      const Tag = ordered ? "ol" : "ul"
      return (
        <Tag className={cn("flex flex-col gap-2 text-foreground", ordered && "list-decimal pl-5", el.variant === "bullet" && "list-disc pl-5")}>
          {lines.map((line, i) => (
            <li key={i} className={cn("leading-relaxed", el.variant === "check" && "flex items-start gap-2")}>
              {el.variant === "check" && <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />}
              <span>{line}</span>
            </li>
          ))}
        </Tag>
      )
    }

    case "image": {
      const shape = IMAGE_SHAPE[el.variant] ?? ""
      return (
        <figure className={cn("flex w-full flex-col gap-2", ALIGN_CLASS[resolved])}>
          {el.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={el.image}
              alt={el.alt}
              loading="lazy"
              className={cn("w-full rounded-2xl object-cover", IMAGE_WIDTH[el.size], shape)}
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
              Choose an image in the editor
            </div>
          )}
          <figcaption className="text-sm text-muted-foreground">
            <Editable path={p("text2")} value={el.text2} placeholder="Caption" />
          </figcaption>
        </figure>
      )
    }

    case "video": {
      const embed = toEmbedUrl(el.href)
      return (
        <figure className="flex flex-col gap-2">
          {embed ? (
            <iframe
              src={embed}
              title={el.text2 || "Video"}
              className="aspect-video w-full rounded-2xl"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-muted px-4 text-center text-sm text-muted-foreground">
              Paste a YouTube or Vimeo link in the editor
            </div>
          )}
          <figcaption className="text-sm text-muted-foreground">
            <Editable path={p("text2")} value={el.text2} placeholder="Caption" />
          </figcaption>
        </figure>
      )
    }

    case "iconBox": {
      const Icon = ICONS[el.variant] ?? HeartIcon
      return (
        <div className={cn("ssc-card flex h-full flex-col gap-3 p-6", ALIGN_CLASS[resolved])}>
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <Editable path={p("text")} value={el.text} as="h3" className="ssc-h3 text-foreground" placeholder="Title" />
          <Editable path={p("text2")} value={el.text2} as="p" multiline className="leading-relaxed text-muted-foreground" placeholder="Text" />
        </div>
      )
    }

    case "button": {
      if (!el.text) return null
      const className = el.variant === "accent" ? "ssc-btn-accent" : el.variant === "secondary" ? "ssc-btn-secondary" : "ssc-btn"
      const href = el.href || "#"
      const external = /^https?:\/\//.test(href)
      return (
        <div>
          <Link href={href} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <Editable path={p("text")} value={el.text} placeholder="Button" />
          </Link>
        </div>
      )
    }

    case "divider":
      return el.variant === "brand" ? <BrandRule className={resolved === "center" ? "mx-auto" : undefined} /> : <hr className="border-border" />

    case "spacer":
      return <div aria-hidden="true" className={SPACER_SIZE[el.size]} />

    default:
      return null
  }
}

export function CustomBlock({ section }: { section: Section }) {
  const raw = section.props.elements
  const elements = Array.isArray(raw) ? (raw as CustomElement[]) : []
  const align = section.style.align

  if (elements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        This section is empty. Select it and use Add element to build your layout.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 @3xl:grid-cols-6">
      {elements.map((el, index) => {
        const resolved = el.align === "inherit" ? align : el.align
        return (
          <div key={el.id} className={cn("flex min-w-0 flex-col", SPAN_CLASS[el.span], ALIGN_CLASS[resolved])}>
            <ElementView el={el} index={index} align={align} />
          </div>
        )
      })}
    </div>
  )
}
