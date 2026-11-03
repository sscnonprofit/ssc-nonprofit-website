import type { Metadata } from "next"
import { LegacyContact, LegacyGivingGuide } from "@/components/legacy-giving-guide"
import { LegacyIntro } from "@/components/legacy-intro"

import siteFallback from "@/content/site.json"
import { getContent } from "@/lib/cms/content"

export const metadata: Metadata = {
  title: "Leave a Legacy",
  description:
    "Ways to leave a lasting legacy with Sheboygan Senior Community: memorial mentions, monetary gifts, donor advised funds, bequests, IRA QCDs, RMDs, and stocks.",
}

export default async function LeaveALegacyPage() {
  const site = await getContent("site", siteFallback)
  const philanthropy = site.contacts.find((c) => c.role === "Director of Philanthropy")
  const contactName = philanthropy?.name ?? "Sue Black"
  const contactEmail = philanthropy?.email ?? "sblack@sscnonprofit.org"
  const developmentPhone = site.developmentPhone ?? "(920) 458-2137 ext. 826"

  return (
    <div className="bg-background font-sans text-foreground">
      <LegacyIntro />
      <section id="giving-options" aria-labelledby="giving-options-title" className="mx-auto flex max-w-6xl scroll-mt-28 flex-col gap-9 px-6 pb-16 sm:gap-12 sm:pb-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your generosity. Your legacy.</p>
          <h2 id="giving-options-title" className="text-balance font-display text-3xl font-semibold leading-tight sm:text-4xl">Many ways to make a lasting difference.</h2>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground">Honor someone you love, give today, or plan for tomorrow. Every gift helps keep our community a place to call home.</p>
        </div>
        <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <LegacyGivingGuide onlineGiving={site.onlineGiving} />
          <LegacyContact
            name={contactName}
            email={contactEmail}
            phone={developmentPhone}
            phoneHref={site.phoneHref ? `${site.phoneHref},826` : "tel:+19204582137,826"}
          />
        </div>
      </section>
    </div>
  )
}
