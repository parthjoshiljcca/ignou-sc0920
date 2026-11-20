import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa";
import { CENTRE } from "@/lib/constants";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: CENTRE.name, template: `%s · ${CENTRE.shortName}` },
  description: "Help desk, counselling schedule and notices for students of IGNOU Study Centre 0920.",
  applicationName: CENTRE.shortName,
  authors: [{ name: "Parth D. Joshi" }],
  creator: "Parth D. Joshi",
  appleWebApp: { capable: true, title: CENTRE.shortName, statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32" }, { url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0066b2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c111c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
