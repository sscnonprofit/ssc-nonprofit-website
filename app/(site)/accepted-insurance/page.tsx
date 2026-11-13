import type { Metadata } from "next"
import { AcceptedInsuranceContent } from "@/components/accepted-insurance-content"

const description = "Explore accepted insurance plans for short-term rehabilitation at Sheboygan Senior Community, Medicare enrollment dates, and answers to common coverage questions."

export const metadata: Metadata = {
  title: "Accepted Insurance Plans",
  description,
  alternates: { canonical: "/accepted-insurance" },
  openGraph: {
    title: "Accepted Insurance Plans – Sheboygan Senior Community",
    description,
    url: "/accepted-insurance",
  },
}

export const dynamic = "force-dynamic"

export default function AcceptedInsurancePage() {
  return <AcceptedInsuranceContent />
}
