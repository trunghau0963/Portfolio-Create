import type React from "react";
import type { Metadata } from "next";
import Client from "./client";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { SectionProvider } from "@/context/section-context";
import { SettingsProvider } from "@/context/settings-context";
import { Toaster } from "@/components/ui/sonner";
import LayoutWrapper from "@/components/layout-wrapper";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
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
