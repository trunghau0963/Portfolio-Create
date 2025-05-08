"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import {
  apiService,
  type Settings as ApiSettings,
} from "@/services/api-service"; // Import your apiService
import { toast } from "sonner";

// Define the shape of the settings context
interface SettingsContextType {
  settings: ApiSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<ApiSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

// Default settings used if fetching fails or before first fetch
const defaultSettings: ApiSettings = {
  id: "default", // Placeholder ID
  theme: "dark",
  showPortrait: true,
  resumeUrl: "/resume.pdf",
  globalFontFamily: "font-sans",
  siteTitle: "PORTFOLIO",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

// Create the provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to load settings");
      setSettings(defaultSettings); // Fallback to default on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Function to update settings
  const updateSettings = useCallback(
    async (newSettingsData: Partial<ApiSettings>) => {
      if (!settings) {
        toast.error("Settings not loaded yet.");
        return;
      }
      // Optimistic update (optional but good for UX)
      const previousSettings = settings;
      setSettings((prev) => (prev ? { ...prev, ...newSettingsData } : null));

      try {
        const updatedSettings = await apiService.saveSettings(newSettingsData);
        setSettings(updatedSettings); // Update with response from server
        toast.success("Settings updated successfully!");
      } catch (err: any) {
        console.error("Error updating settings:", err);
        setError(err.message || "Failed to update settings");
        setSettings(previousSettings); // Revert optimistic update on error
        toast.error(`Failed to update settings: ${err.message}`);
        throw err; // Re-throw error so calling component knows it failed
      }
    },
    [settings] // Dependency includes settings to access the current state for optimistic revert
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
