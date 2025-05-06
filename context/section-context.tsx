"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Section, apiService } from "@/services/api-service";

// Define connection status type
type ConnectionStatus = "unknown" | "checking" | "connected" | "error";

interface SectionContextType {
  sections: Section[];
  addSection: (section: Section) => Promise<Section>;
  updateSection: (section: Section) => Promise<Section>;
  deleteSection: (id: string) => Promise<boolean>;
  reorderSections: (sections: Section[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  retryConnection: () => Promise<void>;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export function SectionProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("unknown");

  // Fetch sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  // Function to fetch sections (extracted for reuse)
  const fetchSections = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus("checking");

    try {
      // Fetch sections from API
      const data = await apiService.getSections();
      setSections(data);
      setConnectionStatus("connected");
    } catch (err: any) {
      console.error("Error fetching sections:", err);
      setError(err.message || "Failed to load sections");
      setConnectionStatus("error");

      // Optional: Fall back to localStorage if API fails
      const storedSections = localStorage.getItem("portfolio-sections");
      if (storedSections) {
        setSections(JSON.parse(storedSections));
        // Keep status as error to indicate API failure
      } else {
        // Optional: Set default sections if nothing is available
        // setSections([...defaultSections])
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save sections to localStorage as backup
  useEffect(() => {
    if (sections.length > 0 && connectionStatus !== "error") {
      localStorage.setItem("portfolio-sections", JSON.stringify(sections));
    }
  }, [sections, connectionStatus]);

  const addSection = async (section: Section): Promise<Section> => {
    try {
      // Try API
      const savedSection = await apiService.saveSection(section);
      setSections((prev) => [...prev, savedSection]);
      return savedSection;
    } catch (err) {
      console.error("Error adding section:", err);
      setError("Failed to add section");
      throw err;
    }
  };

  const updateSection = async (section: Section): Promise<Section> => {
    try {
      // Try API
      const updatedSection = await apiService.saveSection(section);
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? updatedSection : s))
      );
      return updatedSection;
    } catch (err) {
      console.error("Error updating section:", err);
      setError("Failed to update section");
      throw err;
    }
  };

  const deleteSection = async (id: string): Promise<boolean> => {
    try {
      // Try API
      const result = await apiService.deleteSection(id);
      if (result.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
      }
      return result.success;
    } catch (err) {
      console.error("Error deleting section:", err);
      setError("Failed to delete section");
      throw err;
    }
  };

  const reorderSections = async (
    reorderedSections: Section[]
  ): Promise<void> => {
    try {
      setSections(reorderedSections);

      // Update each section with new order
      for (const [index, section] of reorderedSections.entries()) {
        const updatedSection = { ...section, order: index };
        await apiService.saveSection(updatedSection);
      }
    } catch (err) {
      console.error("Error reordering sections:", err);
      setError("Failed to reorder sections");
      throw err;
    }
  };

  // Function to retry connection (simply re-fetches)
  const retryConnection = async () => {
    await fetchSections();
  };

  return (
    <SectionContext.Provider
      value={{
        sections,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        isLoading,
        error,
        connectionStatus,
        retryConnection,
      }}
    >
      {children}
    </SectionContext.Provider>
  );
}

export function useSections() {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error("useSections must be used within a SectionProvider");
  }
  return context;
}
