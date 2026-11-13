import { ArrowUpRight, Bird, CalendarDays, ChartLine, FilePen, HandHeart, Landmark, Mail, Phone, type LucideIcon } from "lucide-react"

type GivingOption = {
  title: string
  body: string
  icon?: LucideIcon
  label?: string
  donorDetails?: boolean
  action?: "donate" | "contact"
}

const GIVING_OPTIONS: GivingOption[] = [
  {
    title: "Memorial mention",
    icon: Bird,
    body: "If you or your family are considering including a memorial in your loved one’s obituary, we would be deeply grateful if you would consider mentioning Sheboygan Senior Community (SSC).",
  },
  {
    title: "Monetary gifts",
    icon: HandHeart,
    body: "Making a monetary gift is the simplest and fastest way of supporting SSC. Monetary gifts also have tax advantages depending on your income and the amount of your deductions.",
    action: "donate",
  },
  {
    title: "Donor advised funds",
    icon: Landmark,
    body: "Donor-advised funds (DAF) are one of the most straightforward and tax-advantageous ways to give. If you have a DAF, please share the following information with your DAF administrator.",
    donorDetails: true,
  },
  {
    title: "Bequests",
    icon: FilePen,
    body: "Making a gift in your will or living trust, known as a bequest, to SSC can guarantee that your legacy endures. Your gift may be a specific dollar amount or a percentage of your estate.",
  },
  {
    title: "IRA qualified charitable deductions (QCD)",
    label: "IRA",
    body: "A QCD is a direct transfer of funds from your IRA payable to SSC. A QCD can be counted toward satisfying your required minimum distribution (RMD) under certain conditions. Making gifts from your IRA can have tax advantages if you are at least 70 ½ years of age.",
  },
  {
    title: "Required minimum distribution (RMD)",
    icon: CalendarDays,
    body: "When you reach age 72, gifting your RMD directly to SSC provides tax advantages.",
  },
  {
    title: "Stocks & securities",
    icon: ChartLine,
    body: "A gift of long-term appreciated stocks or other securities may provide you with greater tax advantages than a monetary gift. Transferring appreciated securities to SSC is a simple process. We can provide transfer instructions to your broker at your request.",
    action: "contact",
  },
]

export function LegacyGivingGuide({ onlineGiving }: { onlineGiving: string }) {
  return (
    <div className="min-w-0">
      <ul className="flex flex-col divide-y divide-border">
        {GIVING_OPTIONS.map(({ title, body, icon: Icon, label, donorDetails, action }) => (
          <li key={title} className="flex flex-col gap-4 py-7 first:pt-0 last:pb-0 sm:flex-row sm:gap-6 sm:py-9">
            <div className="flex items-center gap-4 sm:items-start">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 text-primary sm:size-14" aria-hidden="true">
                {Icon ? <Icon className="size-6" strokeWidth={1.5} /> : <span className="text-sm font-bold tracking-wide">{label}</span>}
              </span>
              <h3 className="text-pretty font-display text-xl font-semibold leading-snug text-foreground sm:hidden">{title}</h3>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <h3 className="hidden text-pretty font-display text-2xl font-semibold leading-snug text-foreground sm:block">{title}</h3>
              <p className="text-pretty text-base leading-relaxed text-muted-foreground">{body}</p>
              {donorDetails && (
                <div className="flex flex-col gap-3 rounded-xl bg-secondary p-5 text-secondary-foreground">
                  <p className="text-sm font-semibold">For your DAF administrator</p>
                  <address className="text-base not-italic leading-relaxed">
                    Sheboygan Senior Community<br />
                    3505 County Road Y<br />
                    Sheboygan, WI 53083
                  </address>
                  <p className="border-t border-foreground/10 pt-3 text-sm"><span className="font-semibold">Tax ID / EIN</span> <span className="select-all tabular-nums">36-6069188</span></p>
                </div>
              )}
              {action && (
                <a
                  href={action === "donate" ? onlineGiving : "#legacy-contact"}
                  target={action === "donate" ? "_blank" : undefined}
                  rel={action === "donate" ? "noopener noreferrer" : undefined}
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {action === "donate" ? "Make a monetary gift" : "Request transfer instructions"}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                  {action === "donate" && <span className="sr-only"> (opens in a new tab)</span>}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
        Giving rules and tax benefits vary by individual circumstances and may change. Please consult your financial, legal, or tax advisor when planning your gift.
      </p>
    </div>
  )
}

type LegacyContactProps = {
  name: string
  email: string
  phone: string
  phoneHref: string
}

export function LegacyContact({ name, email, phone, phoneHref }: LegacyContactProps) {
  return (
    <aside id="legacy-contact" aria-labelledby="legacy-help-heading" className="flex scroll-mt-28 flex-col gap-6 self-start rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8 lg:sticky lg:top-28">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Here for you</p>
        <h2 id="legacy-help-heading" className="text-balance font-display text-3xl font-semibold leading-tight">A conversation is a good place to start.</h2>
        <p className="text-pretty text-base leading-relaxed text-primary-foreground/80">You don&apos;t have to have it all figured out. We&apos;re here to help you explore your giving options.</p>
      </div>
      <div className="flex flex-col gap-5 border-t border-primary-foreground/20 pt-6">
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-semibold">{name}</p>
          <p className="text-sm text-primary-foreground/80">Director of Philanthropy</p>
        </div>
        <a href={phoneHref} className="flex min-h-12 items-center gap-3 rounded-lg bg-primary-foreground px-4 py-3 text-base font-semibold text-primary transition-opacity hover:opacity-90">
          <Phone className="size-5 shrink-0" aria-hidden="true" />
          <span>{phone}</span>
        </a>
        <a href={`mailto:${email}`} className="flex min-h-11 items-center gap-3 rounded-md text-sm font-medium text-primary-foreground underline-offset-4 hover:underline focus-visible:outline-primary-foreground">
          <Mail className="size-5 shrink-0" aria-hidden="true" />
          <span className="break-all">{email}</span>
          <ArrowUpRight className="ml-auto size-4 shrink-0" aria-hidden="true" />
        </a>
      </div>
      <p className="text-sm leading-relaxed text-primary-foreground/70">Thank you for considering SSC as part of your legacy.</p>
    </aside>
  )
}
