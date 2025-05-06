import type React from "react"
import type { Metadata } from "next"
import Client from "./client"

export const metadata: Metadata = {
  title: "Portfolio Landing Page",
  description: "A customizable portfolio landing page",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <Client>{children}</Client>
}
