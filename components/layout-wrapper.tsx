"use client";

import { useSettings } from "@/context/settings-context";
import { type ReactNode } from "react";

// Map font setting value to actual CSS class (e.g., Tailwind class)
const getFontClass = (fontFamilySetting?: string): string => {
  switch (fontFamilySetting) {
    case "font-serif":
      return "font-serif";
    case "font-mono":
      return "font-mono";
    // New Sans-serif fonts
    case "font-display":
      return "font-display";
    case "font-handwriting":
      return "font-handwriting";
    case "font-condensed":
      return "font-condensed";
    case "font-rounded":
      return "font-rounded";
    case "font-slab-serif":
      return "font-slab-serif";

    case "font-sans": // Default
    default:
      return "font-sans";
    // Add cases for other fonts if you added them in SectionManager
    // e.g., case "font-inter": return "font-inter";
  }
};

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const { settings, isLoading } = useSettings();

  // Determine font class - use default while loading or if setting is null/invalid
  const fontClass =
    isLoading || !settings
      ? "font-sans"
      : getFontClass(settings.globalFontFamily);

  // Optionally, handle theme class here as well if needed
  // const themeClass = settings?.theme === 'dark' ? 'dark' : '';

  // We return the children directly; the class will be applied in RootLayout
  // This component's purpose is mainly to extract the font class using client hooks.
  // However, modifying body class directly from here is tricky in Next.js App Router.
  // A better approach is to pass the class back up or apply it to a wrapping div.

  // For simplicity now, let's return children wrapped in a div with the font class.
  // A more robust solution might involve CSS variables set on the root.
  return <div className={fontClass}>{children}</div>;

  // --- Alternative (if modifying body from layout.tsx is feasible) ---
  // useEffect(() => {
  //   // Apply font class to body
  //   document.body.classList.remove('font-sans', 'font-serif', 'font-mono'); // Remove old classes
  //   document.body.classList.add(fontClass);
  // }, [fontClass]);
  // return <>{children}</>; // Return children directly if modifying body
}
