"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { type Section as PrismaSection } from "@/lib/generated/prisma";
import { apiService } from "@/services/api-service";
import { toast } from "sonner";

// Use a more specific type if possible, or keep flexible if relations vary
export type Section = PrismaSection & { [key: string]: any };

// Define connection status type
type ConnectionStatus = "unknown" | "checking" | "connected" | "error";

interface SectionContextType {
  sections: Section[];
  addSection: (sectionData: Omit<Section, "id" | "createdAt" | "updatedAt">) => Promise<Section | void>;
  updateSection: (sectionData: Partial<Section> & { id: string }) => Promise<Section | void>;
  deleteSection: (id: string) => Promise<void>;
  reorderSections: (orderedIds: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  retryConnection: () => Promise<void>;
  refetchSections: () => Promise<void>;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = "portfolio-sections-session";

export function SectionProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("unknown");

  // Fetch sections function (now using useCallback)
  const fetchSections = useCallback(async (useCache = true) => {
    if (useCache) {
        const cachedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (cachedData) {
            try {
                setSections(JSON.parse(cachedData));
                setIsLoading(false);
                setConnectionStatus("connected");
                return;
            } catch (e) {
                console.error("Failed to parse cached sections:", e);
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        }
    }

    setIsLoading(true);
    setError(null);
    setConnectionStatus("checking");

    try {
      const data = await apiService.getSections();
      setSections(data);
      setConnectionStatus("connected");
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save sections to sessionStorage:", e);
      }
    } catch (err: any) {
      console.error("Error fetching sections:", err);
      setError(err.message || "Failed to load sections");
      setConnectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount - try using cache first
  useEffect(() => {
    fetchSections(true);
  }, [fetchSections]);

  const addSection = async (sectionData: Omit<Section, "id" | "createdAt" | "updatedAt">): Promise<Section | void> => {
    setIsLoading(true);
    try {
      const savedSection = await apiService.saveSection(sectionData as any);
      await fetchSections(false);
      toast.success(`Section "${savedSection.title}" added!`);
      return savedSection;
    } catch (err) {
      console.error("Error adding section:", err);
      setError("Failed to add section");
      toast.error(`Failed to add section: ${(err as Error).message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSection = async (sectionData: Partial<Section> & { id: string }): Promise<Section | void> => {
     setIsLoading(true);
     try {
       const updatedSection = await apiService.saveSection(sectionData as any);
       await fetchSections(false);
       toast.success(`Section "${updatedSection.title}" updated!`);
       return updatedSection;
     } catch (err) {
       console.error("Error updating section:", err);
       setError("Failed to update section");
       toast.error(`Failed to update section: ${(err as Error).message}`);
       throw err;
     } finally {
       setIsLoading(false);
     }
  };

  const deleteSection = async (id: string): Promise<void> => {
     setIsLoading(true);
     try {
       const result = await apiService.deleteSection(id);
       if (result.success) {
         await fetchSections(false);
         toast.success(`Section deleted!`);
       } else {
          throw new Error("Delete operation returned false from API");
       }
     } catch (err) {
       console.error("Error deleting section:", err);
       setError("Failed to delete section");
       toast.error(`Failed to delete section: ${(err as Error).message}`);
       throw err;
     } finally {
       setIsLoading(false);
     }
  };

  const reorderSections = async (orderedIds: string[]): Promise<void> => {
    const originalSections = [...sections];
    const reorderedMap = new Map(orderedIds.map((id, index) => [id, index]));
    const optimisticallyReordered = sections
        .filter(s => reorderedMap.has(s.id))
        .sort((a, b) => (reorderedMap.get(a.id) ?? Infinity) - (reorderedMap.get(b.id) ?? Infinity))
        .map((section, index) => ({ ...section, order: index }));
    setSections(optimisticallyReordered);

    setIsLoading(true);
    try {
        const response = await fetch('/api/sections/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedIds }),
        });
        if (!response.ok) {
            throw new Error('Failed to reorder sections via API');
        }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(optimisticallyReordered));
      toast.success("Sections reordered!");
    } catch (err) {
      console.error("Error reordering sections:", err);
      setError("Failed to reorder sections");
      toast.error(`Failed to reorder sections: ${(err as Error).message}`);
      setSections(originalSections);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(originalSections));
      throw err;
    } finally {
       setIsLoading(false);
    }
  };

  const refetchSections = async () => {
    await fetchSections(false);
  };

  const retryConnection = async () => {
    await fetchSections(false);
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
        refetchSections,
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
