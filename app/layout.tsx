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
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const fontSerif = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

const fontMono = RobotoMono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const fontDisplay = PlayfairDisplay({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const fontHandwriting = DancingScript({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-handwriting',
});

const fontCondensed = RobotoCondensed({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-condensed',
});

const fontRounded = MPlusRounded1c({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rounded',
  weight: '400',
});

const fontSlabSerif = RobotoSlab({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-slab-serif',
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
    <html lang="en" suppressHydrationWarning={true} className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} ${fontDisplay.variable} ${fontHandwriting.variable} ${fontCondensed.variable} ${fontRounded.variable} ${fontSlabSerif.variable}`}>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <SectionProvider>
            <SettingsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <LayoutWrapper>
                  <Client>{children}</Client>
                </LayoutWrapper>
                <Toaster richColors position="bottom-right" />
              </ThemeProvider>
            </SettingsProvider>
          </SectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
