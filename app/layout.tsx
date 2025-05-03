import type React from "react";
import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "Creative Portfolio",
//   description: "A bold, modern portfolio website",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
            {/* <div className="fixed bottom-4 right-4 z-50">
              <ThemeToggle />
            </div> */}
          </ThemeProvider>
        </body>
      </html>
    </>
  );
}
