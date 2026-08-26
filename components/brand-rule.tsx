import { cn } from "@/lib/utils"

/**
 * The signature element of the site: a four-band rule derived from the colored
 * leaf bars in the SSC logo mark. Used to open sections instead of a generic
 * accent line, so the brand identity carries through every page.
 */
export function BrandRule({ className }: { className?: string }) {
  return (
    <span className={cn("ssc-rule", className)} aria-hidden="true">
      <span className="bg-primary" />
      <span className="bg-accent" />
      <span className="bg-[oklch(0.58_0.11_140)]" />
      <span className="bg-[oklch(0.42_0.06_150)]" />
    </span>
  )
}
