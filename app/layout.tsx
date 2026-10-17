import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Mintfolio — Modern portfolio OS for precious metals",
    template: "%s · Mintfolio",
  },
  description:
    "Track, value, and manage your physical gold and silver holdings in one elegant dashboard.",
  metadataBase: new URL("https://mintfolio.app"),
};

// "cover" exposes env(safe-area-inset-*) so the phone tab bar clears the home indicator.
export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the theme script adds `dark` to <html> before React loads.
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
