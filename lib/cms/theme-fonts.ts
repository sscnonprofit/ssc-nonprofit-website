import {
  Bricolage_Grotesque,
  DM_Sans,
  Inter,
  Lora,
  Merriweather,
  Nunito_Sans,
  Playfair_Display,
  Source_Serif_4,
} from "next/font/google"

// Only the default pair is preloaded. The rest are declared so the Design
// Studio can switch to them instantly; browsers only download a face once a
// rule actually uses it.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false })
const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito-sans", display: "swap", preload: false })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false })
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
})
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false })
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap", preload: false })

export const fontVariables = [inter, bricolage, dmSans, nunitoSans, lora, merriweather, playfair, sourceSerif]
  .map((f) => f.variable)
  .join(" ")
