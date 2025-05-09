"use client";

import { useSettings } from "@/context/settings-context";
import { type ReactNode, useEffect } from "react";

// Maps the setting value (e.g., 'font-serif') to the corresponding Tailwind utility class
const fontMapping: { [key: string]: string } = {
  "font-sans": "font-sans", // Will use var(--font-inter)
  "font-serif": "font-serif", // Will use var(--font-lora)
  "font-mono": "font-mono", // Will use var(--font-roboto-mono)
  "font-display": "font-display", // Will use var(--font-playfair-display)
  "font-handwriting": "font-handwriting", // Will use var(--font-dancing-script)
  "font-condensed": "font-condensed", // Will use var(--font-roboto-condensed)
  "font-rounded": "font-rounded", // Will use var(--font-mplus-rounded)
  "font-slab-serif": "font-slab-serif", // Will use var(--font-roboto-slab)
  // Ensure these keys exactly match the 'value' prop of SelectItem in SectionManager
  // The values (e.g., "font-serif") must match the keys defined in tailwind.config.ts fontFamily
};

// This should be the KEY used in fontMapping that represents your default font.
const defaultFontKeyInSettings = "font-sans";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    const targetElement = document.body;

    // Determine the key for the font setting. Use default if loading or no setting.
    const currentFontSettingKey = isLoading
      ? defaultFontKeyInSettings
      : settings?.globalFontFamily || defaultFontKeyInSettings;

    // Get the Tailwind class for the new font, or default if key is invalid.
    const newFontClass =
      fontMapping[currentFontSettingKey] ||
      fontMapping[defaultFontKeyInSettings];

    // Remove all previously managed font classes to prevent conflicts.
    const AllPossibleFontClasses = Object.values(fontMapping);
    AllPossibleFontClasses.forEach((cls) => {
      if (cls && targetElement.classList.contains(cls)) {
        targetElement.classList.remove(cls);
      }
    });

    // Add the new font class if it's valid.
    if (newFontClass) {
      targetElement.classList.add(newFontClass);
    }
  }, [settings?.globalFontFamily, isLoading]);

  return <>{children}</>; // Children are rendered directly, body class is managed by useEffect
}
