import { cn } from "@/lib/utils"
import { BrandRule } from "@/components/brand-rule"

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string
  title: string
  intro?: string
  align?: "left" | "center"
  className?: string
  as?: "h1" | "h2" | "h3"
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <BrandRule />
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <Tag
        className={cn(
          "text-balance font-semibold",
          Tag === "h1" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl",
        )}
      >
        {title}
      </Tag>
      {intro ? (
        <p className={cn("max-w-3xl text-pretty leading-relaxed text-muted-foreground", align === "center" && "mx-auto")}>
          {intro}
        </p>
      ) : null}
    </div>
  )
}
