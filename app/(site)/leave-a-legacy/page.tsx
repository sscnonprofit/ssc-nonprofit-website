import type { Metadata } from "next"
import Image from "next/image"
import { Bird, CalendarDays, ChartLine, FilePen, HandHeart, Landmark, Mail, Phone, type LucideIcon } from "lucide-react"

import siteFallback from "@/content/site.json"
import { getContent } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "Leave a Legacy",
  description:
    "Ways to leave a lasting legacy with Sheboygan Senior Community: memorial mentions, monetary gifts, donor advised funds, bequests, IRA QCDs, RMDs, and stocks.",
}

type GivingOption = {
  title: string
  body: string
  icon?: LucideIcon
  label?: string
}

const GIVING_OPTIONS: GivingOption[] = [
  {
    title: "Memorial Mention",
    icon: Bird,
    body: "If you or your family are considering including a memorial in your loved one\u2019s obituary, we would be deeply grateful if you would consider mentioning Sheboygan Senior Community (SSC).",
  },
  {
    title: "Monetary",
    icon: HandHeart,
    body: "Making a monetary gift is the simplest and fastest way of supporting SSC. Monetary gifts also have tax advantages depending on your income and the amount of your deductions.",
  },
  {
    title: "Donor Advised Funds",
    icon: Landmark,
    body: "Donor-advised funds (DAF) are one of the most straightforward and tax-advantageous ways to give. If you have a DAF, please share this information with your DAF administrator: Sheboygan Senior Community, 3505 County Road Y, Sheboygan, WI 53083, EIN - 36-6069188.",
  },
  {
    title: "Bequests",
    icon: FilePen,
    body: "Making a gift in your will or living trust, known as a bequest, to SSC can guarantee that your legacy endures. Your gift may be a specific dollar amount or a percentage of your estate.",
  },
  {
    title: "IRA Qualified Charitable Deductions (QCD)",
    label: "IRA",
    body: "A QCD is a direct transfer of funds from your IRA payable to SSC. A QCD can be counted toward satisfying your required minimum distribution (RMD) under certain conditions. Making gifts from your IRA can have tax advantages if you are at least 70 \u00BD years of age.",
  },
  {
    title: "Required Minimum Distribution (RMD)",
    icon: CalendarDays,
    body: "When you reach age 72, gifting your RMD directly to SSC provides tax advantages.",
  },
  {
    title: "Stocks & Securities",
    icon: ChartLine,
    body: "A gift of long-term appreciated stocks or other securities may provide you with greater tax advantages than a monetary gift. Transferring appreciated securities to SSC is a simple process. We can provide transfer instructions to your broker at your request.",
  },
]

function OptionBadge({ icon: Icon, label }: Pick<GivingOption, "icon" | "label">) {
  return (
    <div
      className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-24"
      aria-hidden="true"
    >
      {Icon ? (
        <Icon className="size-8 sm:size-11" strokeWidth={1.5} />
      ) : (
        <span className="font-sans text-lg font-semibold tracking-wide sm:text-2xl">{label}</span>
      )}
    </div>
  )
}

export default async function LeaveALegacyPage() {
  const site = await getContent("site", siteFallback)
  const philanthropy = site.contacts.find((c) => c.role === "Director of Philanthropy")
  const contactName = philanthropy?.name ?? "Sue Black"
  const contactEmail = philanthropy?.email ?? "sblack@sscnonprofit.org"
  const developmentPhone = site.developmentPhone ?? "(920) 458-2137 ext. 826"

  return (
    <div className="bg-background">
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20">
        <h1 className="text-balance text-center font-display text-4xl font-bold text-primary sm:text-6xl">
          Leave a Legacy
        </h1>

        <ul className="mt-10 flex flex-col sm:mt-14">
          {GIVING_OPTIONS.map((option) => (
            <li
              key={option.title}
              className="flex items-start gap-4 border-b border-primary/40 py-7 sm:items-center sm:gap-8 sm:py-9"
            >
              <OptionBadge icon={option.icon} label={option.label} />
              <div className="flex flex-col gap-2 border-l-2 border-primary pl-4 sm:pl-6">
                <h2 className="text-pretty font-sans text-base font-bold uppercase tracking-wide text-foreground sm:text-xl">
                  {option.title}
                </h2>
                <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">{option.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <aside
          aria-labelledby="legacy-help-heading"
          className="relative mt-12 overflow-hidden rounded-2xl border-2 border-primary px-5 py-8 sm:mt-16 sm:px-10 sm:py-10"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 sm:pr-32">
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-24"
              aria-hidden="true"
            >
              <Phone className="size-8 sm:size-11" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-3">
              <h2 id="legacy-help-heading" className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                We are here to help!
              </h2>
              <p className="text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                If you have questions about any of these giving opportunities, please contact{" "}
                <strong className="font-semibold text-foreground">
                  {contactName}, Director of Philanthropy
                </strong>
                .
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
                <a
                  href={site.phoneHref ? `${site.phoneHref},826` : "tel:+19204582137,826"}
                  className="inline-flex min-h-11 items-center gap-3 text-base font-medium text-foreground underline-offset-4 hover:underline"
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Phone className="size-5" aria-hidden="true" />
                  </span>
                  {developmentPhone}
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex min-h-11 items-center gap-3 break-all text-base font-medium text-foreground underline-offset-4 hover:underline"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Mail className="size-5" aria-hidden="true" />
                  </span>
                  {contactEmail}
                </a>
              </div>
            </div>
          </div>
          <Image
            src="/images/legacy-olive-branch.png"
            alt=""
            width={240}
            height={240}
            className="pointer-events-none absolute -bottom-2 -right-4 hidden w-36 mix-blend-multiply sm:block"
          />
        </aside>
      </section>
    </div>
  )
}
