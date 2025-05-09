import type React from "react";
import type { Metadata } from "next";
import Client from "./client";
import {
  Inter,
  Lora,
  Roboto_Mono as RobotoMono,
  Playfair_Display as PlayfairDisplay,
  Dancing_Script as DancingScript,
  Roboto_Condensed as RobotoCondensed,
  M_PLUS_Rounded_1c as MPlusRounded1c,
  Roboto_Slab as RobotoSlab,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SectionProvider } from "@/context/section-context";
import { SettingsProvider } from "@/context/settings-context";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/components/layout-wrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const robotoMono = RobotoMono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-mono",
});
const playfairDisplay = PlayfairDisplay({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});
const dancingScript = DancingScript({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-dancing-script",
});
const robotoCondensed = RobotoCondensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-condensed",
});
const mPlusRounded1c = MPlusRounded1c({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mplus-rounded",
});
const robotoSlab = RobotoSlab({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto-slab",
});

export const metadata: Metadata = {
  title: "Portfolio Landing Page",
  description: "A customizable portfolio landing page",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${lora.variable} ${robotoMono.variable} ${
          playfairDisplay.variable
        } ${dancingScript.variable} ${robotoCondensed.variable} ${
          mPlusRounded1c.variable
        } ${robotoSlab.variable}`}
      >
        <AuthProvider>
          <SectionProvider>
            <SettingsProvider>
              <LayoutWrapper>
                <Client>{children}</Client>
              </LayoutWrapper>
              <Toaster />
            </SettingsProvider>
          </SectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
