import { cn } from "@/lib/utils"

/**
 * The signature element of the site: a four-band rule derived from the colored
 * leaf bars in the SSC logo mark. Used to open sections instead of a generic
 * accent line, so the brand identity carries through every page.
 */
export function BrandRule({ className }: { className?: string }) {
  return (
    <span className={cn("ssc-rule", className)} aria-hidden="true">
      <span className="bg-brand-1" />
      <span className="bg-brand-2" />
      <span className="bg-brand-3" />
      <span className="bg-brand-4" />
    </span>
  )
}
