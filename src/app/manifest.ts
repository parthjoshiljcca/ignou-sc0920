import type { MetadataRoute } from "next";
import { CENTRE } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: CENTRE.name,
    short_name: CENTRE.shortName,
    description: "Raise queries, see counselling schedules and get notices from IGNOU Study Centre 0920.",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0066b2",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ask a question", url: "/tickets/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Class schedule", url: "/schedule", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
