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
      <head>
        {/* Browser page-translation (e.g. Chrome → Hindi/Gujarati) rewrites text nodes behind React's back,
            which makes React crash with removeChild/insertBefore errors. Make those two DOM calls tolerant. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof Node!=="function"||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c&&c.parentNode!==this){return c}return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n}return i.apply(this,arguments)}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
