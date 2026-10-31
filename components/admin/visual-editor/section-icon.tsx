import {
  BoxIcon,
  ChartColumnIcon,
  CircleHelpIcon,
  ImagesIcon,
  LayoutTemplateIcon,
  ListIcon,
  MailIcon,
  MousePointerClickIcon,
  SearchIcon,
  TextIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

const RULES: [RegExp, LucideIcon][] = [
  [/seo|meta/i, SearchIcon],
  [/hero|header|banner|intro/i, LayoutTemplateIcon],
  [/cta|button|action|donate/i, MousePointerClickIcon],
  [/team|people|leader|member|staff|board|founder|testimonial/i, UsersIcon],
  [/faq|question/i, CircleHelpIcon],
  [/stat|metric|number|impact/i, ChartColumnIcon],
  [/contact|email|form|newsletter/i, MailIcon],
  [/gallery|image|photo|media|logo/i, ImagesIcon],
]

export type SectionKind = "general" | "object" | "list"

function pickIcon(sectionKey: string | null, kind: SectionKind): LucideIcon {
  if (kind === "general") return TextIcon
  const match = RULES.find(([pattern]) => sectionKey && pattern.test(sectionKey))
  if (match) return match[1]
  return kind === "list" ? ListIcon : BoxIcon
}

/** Picks an icon for a content group from its name, so long pages are easy to scan. */
export function SectionIcon({ sectionKey, kind, className }: { sectionKey: string | null; kind: SectionKind; className?: string }) {
  const Icon = pickIcon(sectionKey, kind)
  return <Icon className={className} aria-hidden="true" />
}
