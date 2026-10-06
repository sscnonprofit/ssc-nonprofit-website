import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sheboygan Senior Community",
    short_name: "SSC",
    description: "Compassionate senior living and care in Sheboygan, Wisconsin.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#7c1231",
    icons: [
      {
        src: "/images/ssc-logo.png",
        sizes: "196x49",
        type: "image/png",
        purpose: "any",
      },
    ],
  }
}
