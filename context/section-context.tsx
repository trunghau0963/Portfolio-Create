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
  const [sections, setSections] = useState<AppSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("unknown");

  // Thêm hàm utility để cập nhật cache
  const updateSessionCache = useCallback((data: AppSection[]) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to update sections cache:", e);
    }
  }, []);

  const fetchSections = useCallback(async (useCache = true) => {
    if (useCache) {
      const cachedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData).map((s: any) => ({
            ...s,
            createdAt: safeNewDate(s.createdAt),
            updatedAt: safeNewDate(s.updatedAt),
          })) as AppSection[];
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
      const dataFromApi = await apiService.getSections();
      const normalizedData = dataFromApi.map((s: any) => ({
        ...s,
        createdAt: safeNewDate(s.createdAt),
        updatedAt: safeNewDate(s.updatedAt),
      })) as AppSection[];
      
      setSections(normalizedData);
      setConnectionStatus("connected");
      updateSessionCache(normalizedData);
    } catch (err: any) {
      console.error("Error fetching sections:", err);
      setError(err.message || "Failed to load sections");
      setConnectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [updateSessionCache]);

  useEffect(() => {
    fetchSections(false); // Always fetch fresh data on initial load
  }, [fetchSections]);

  const addSection = async (sectionData: Omit<AppSection, "id" | "createdAt" | "updatedAt" | 'textBlocks' | 'imageBlocks' | 'contactInfoItems' | 'customSectionContentBlocks' | 'heroContent' | 'educationItems' | 'skillItems' | 'skillImages' | 'experienceItems' | 'projectItems' | 'testimonialItems'>): Promise<AppSection | void> => {
    setIsLoading(true);
    try {
      const savedSection = await apiService.saveSection(sectionData as any);
      const updatedSections = await apiService.getSections();
      const normalizedSections = updatedSections.map(s => ({
        ...s,
        createdAt: safeNewDate(s.createdAt),
        updatedAt: safeNewDate(s.updatedAt)
      })) as AppSection[];
      setSections(normalizedSections);
      updateSessionCache(normalizedSections);
      toast.success(`Section "${savedSection.title}" added!`);
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
      await apiService.saveSection(sectionData as any);
      const updatedSections = await apiService.getSections();
      const normalizedSections = updatedSections.map(s => ({
        ...s,
        createdAt: safeNewDate(s.createdAt),
        updatedAt: safeNewDate(s.updatedAt)
      })) as AppSection[];
      setSections(normalizedSections);
      updateSessionCache(normalizedSections);
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
        const updatedSections = await apiService.getSections();
        const normalizedSections = updatedSections.map(s => ({
          ...s,
          createdAt: safeNewDate(s.createdAt),
          updatedAt: safeNewDate(s.updatedAt)
        })) as AppSection[];
        setSections(normalizedSections);
        updateSessionCache(normalizedSections);
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
      .map((section, index) => ({ ...section, order: index })) as AppSection[];
    
    setSections(optimisticallyReordered);
    updateSessionCache(optimisticallyReordered);

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
      toast.success("Sections reordered!");
    } catch (err) {
      console.error("Error reordering sections:", err);
      setError("Failed to reorder sections");
      toast.error(`Failed to reorder sections: ${(err as Error).message}`);
      setSections(originalSections);
      updateSessionCache(originalSections);
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
