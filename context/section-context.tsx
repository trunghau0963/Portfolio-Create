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
  type Section as PrismaSection,
  type TextBlock as PrismaTextBlock,
  type HeroSectionContent as PrismaHeroContent,
  type ImageBlock as PrismaImageBlock,
  type ContactInfoItem as PrismaContactInfoItem,
  type CustomSectionContentBlock as PrismaCustomSectionContentBlock,
  type EducationItem as PrismaEducationItem,
  type EducationImage as PrismaEducationImage,
  type SkillItem as PrismaSkillItem,
  type SkillImage as PrismaSkillImage,
  type ExperienceItem as PrismaExperienceItem,
  type ExperienceDetailImage as PrismaExperienceDetailImage,
  type ProjectItem as PrismaProjectItem,
  type TestimonialItem as PrismaTestimonialItem,
} from "@/lib/generated/prisma"; // Import all necessary Prisma types
import { apiService } from "@/services/api-service";
import { toast } from "sonner";

// Define a comprehensive AppSection type
export type AppSection = PrismaSection & {
  textBlocks: PrismaTextBlock[];
  imageBlocks: PrismaImageBlock[];
  contactInfoItems: PrismaContactInfoItem[];
  customSectionContentBlocks: PrismaCustomSectionContentBlock[];
  heroContent: PrismaHeroContent | null;
  educationItems?: (PrismaEducationItem & { images: PrismaEducationImage[] })[];
  skillItems?: PrismaSkillItem[];
  skillImages?: PrismaSkillImage[];
  experienceItems?: (PrismaExperienceItem & { detailImages: PrismaExperienceDetailImage[] })[];
  projectItems?: PrismaProjectItem[];
  testimonialItems?: PrismaTestimonialItem[];
};

// Define connection status type
type ConnectionStatus = "unknown" | "checking" | "connected" | "error";

interface SectionContextType {
  sections: AppSection[]; // Use AppSection type
  addSection: (sectionData: Omit<AppSection, "id" | "createdAt" | "updatedAt" | 'textBlocks' | 'imageBlocks' | 'contactInfoItems' | 'customSectionContentBlocks' | 'heroContent' | 'educationItems' | 'skillItems' | 'skillImages' | 'experienceItems' | 'projectItems' | 'testimonialItems'>) => Promise<AppSection | void>; // Adjust Omit
  updateSection: (sectionData: Partial<AppSection> & { id: string }) => Promise<AppSection | void>;
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

// Helper function to safely create a Date object
const safeNewDate = (dateInput: string | number | Date | undefined): Date => {
  return dateInput ? new Date(dateInput) : new Date(); // Fallback to new Date() or handle as needed
};

export function SectionProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<AppSection[]>([]); // Use AppSection type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("unknown");

  const fetchSections = useCallback(async (useCache = true) => {
    if (useCache) {
      const cachedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData).map((s: any) => ({
            ...s,
            createdAt: safeNewDate(s.createdAt),
            updatedAt: safeNewDate(s.updatedAt),
            // Potentially normalize nested date fields in relations if they exist and are stringified
          })) as AppSection[]; // Cast to AppSection[]
          setSections(parsedData);
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
      const dataFromApi = await apiService.getSections(); // This should fetch data matching AppSection structure
      const normalizedData = dataFromApi.map((s: any) => ({
        ...s,
        createdAt: safeNewDate(s.createdAt),
        updatedAt: safeNewDate(s.updatedAt),
        // Ensure all relational data fetched by getSections matches AppSection structure
      })) as AppSection[]; // Cast to AppSection[]
      setSections(normalizedData);
      setConnectionStatus("connected");
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizedData));
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

  useEffect(() => {
    fetchSections(true);
  }, [fetchSections]);

  const addSection = async (sectionData: Omit<AppSection, "id" | "createdAt" | "updatedAt" | 'textBlocks' | 'imageBlocks' | 'contactInfoItems' | 'customSectionContentBlocks' | 'heroContent' | 'educationItems' | 'skillItems' | 'skillImages' | 'experienceItems' | 'projectItems' | 'testimonialItems'>): Promise<AppSection | void> => {
    setIsLoading(true);
    try {
      // apiService.saveSection should accept this partial data for creation
      const savedSection = await apiService.saveSection(sectionData as any); // Cast as needed by apiService
      await fetchSections(false); // Refreshes the entire list with all relations
      toast.success(`Section "${savedSection.title}" added!`);
      // The savedSection from apiService might not have all relations immediately unless API returns them.
      // fetchSections(false) ensures we get the full structure.
      // We can find the newly added section from the refetched list if needed, but often not necessary to return it here.
    } catch (err) {
      console.error("Error adding section:", err);
      setError("Failed to add section");
      toast.error(`Failed to add section: ${(err as Error).message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSection = async (sectionData: Partial<AppSection> & { id: string }): Promise<AppSection | void> => {
    setIsLoading(true);
    try {
      // apiService.saveSection should handle partial updates
      await apiService.saveSection(sectionData as any); // Cast as needed
      await fetchSections(false);
      toast.success(`Section "${sectionData.title || 'Section'}" updated!`);
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
    setSections(optimisticallyReordered as AppSection[]); // Cast to AppSection[]

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
      // No immediate refetch needed due to optimistic update, but ensure API is source of truth over time
    } catch (err) {
      console.error("Error reordering sections:", err);
      setError("Failed to reorder sections");
      toast.error(`Failed to reorder sections: ${(err as Error).message}`);
      setSections(originalSections as AppSection[]); // Cast to AppSection[]
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
