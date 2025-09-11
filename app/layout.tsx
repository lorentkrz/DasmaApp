import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import I18nClientProvider from "@/components/i18n-client-provider";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

export const metadata: Metadata = {
  title: "Dasma ERP",
  description: "Aplikacion për menaxhimin e dasmave",
  generator: "Dasma ERP",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♥</text></svg>",
    shortcut: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♥</text></svg>",
    apple: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>♥</text></svg>",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} overflow-hidden`}>
        <Script id="density-init" strategy="beforeInteractive">
          {`
            try {
              var d = localStorage.getItem('ui_density');
              if (d !== 'compact' && d !== 'comfortable') {
                d = 'comfortable';
              }
              document.documentElement.setAttribute('data-density', d);
            } catch {}
          `}
        </Script>
        <I18nClientProvider>
          {children}
        </I18nClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
