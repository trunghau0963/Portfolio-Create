"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  Layers,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { useSections } from "@/context/section-context";
import { useSettings } from "@/context/settings-context";
import { type Section as PrismaSection } from "@/lib/generated/prisma";
import { toast } from "sonner";

// Define section types
export type SectionType =
  | "hero"
  | "introduction"
  | "education"
  | "skills"
  | "experience"
  | "projects"
  | "testimonials"
  | "contact"
  | "custom";

interface SectionManagerProps {
  onDataChange?: () => void; // Optional callback
}

export default function SectionManager({ onDataChange }: SectionManagerProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // Use SectionContext
  const {
    sections: contextSections,
    updateSection: contextUpdateSection,
    addSection: contextAddSection,
    deleteSection: contextDeleteSection,
    reorderSections: contextReorderSections,
    isLoading: sectionsLoading,
    error: sectionsError,
    retryConnection,
  } = useSections();

  // Use SettingsContext
  const {
    settings,
    updateSettings,
    isLoading: settingsLoading,
  } = useSettings();

  // State for dialogs and local form inputs
  const [isOpen, setIsOpen] = useState(false);
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false);
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);

  // sectionToEdit and sectionToDelete will now hold PrismaSection or compatible type
  const [sectionToEdit, setSectionToEdit] = useState<PrismaSection | null>(
    null
  );
  const [sectionToDeleteId, setSectionToDeleteId] = useState<string | null>(
    null
  );

  // New section form state (slug will be needed)
  const [newSectionType, setNewSectionType] = useState<SectionType>("custom");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionSlug, setNewSectionSlug] = useState("");

  // Edit section form state (slug will be needed)
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionSlug, setEditSectionSlug] = useState("");

  const [isTogglingVisibility, setIsTogglingVisibility] = useState<
    string | null
  >(null);

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isUpdatingSection, setIsUpdatingSection] = useState(false);
  const [isDeletingSection, setIsDeletingSection] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // State for font selection
  const [selectedFont, setSelectedFont] = useState<string>("");
  const [isSavingFont, setIsSavingFont] = useState(false);

  // Update selectedFont when settings load or change
  useEffect(() => {
    if (settings?.globalFontFamily) {
      setSelectedFont(settings.globalFontFamily);
    }
  }, [settings?.globalFontFamily]);

  // Handler to save global font setting
  const handleFontChange = async (newFont: string) => {
    setSelectedFont(newFont);
    setIsSavingFont(true);
    try {
      await updateSettings({ globalFontFamily: newFont });
      // Toast is handled within context updateSettings
    } catch (error) {
      // Error toast handled within context updateSettings, maybe revert local state?
      if (settings?.globalFontFamily) {
        setSelectedFont(settings.globalFontFamily); // Revert on failure
      }
    } finally {
      setIsSavingFont(false);
    }
  };

  // Define a more flexible section type for functions until context provides full PrismaSection consistently
  type SectionForManager = Pick<
    PrismaSection,
    "id" | "title" | "type" | "visible" | "order"
  > & { slug?: string; [key: string]: any };

  // Toggle section visibility using context
  const toggleSectionVisibility = async (section: SectionForManager) => {
    setIsTogglingVisibility(section.id);
    try {
      // Construct the payload with only necessary and existing fields to avoid type issues with contextUpdateSection
      const payload: Partial<PrismaSection> & { id: string } = {
        id: section.id,
        visible: !section.visible,
      };
      await contextUpdateSection(payload as PrismaSection); // Cast if contextUpdateSection expects full PrismaSection
      toast.success(`Section "${section.title}" visibility updated.`);
      onDataChange?.(); // Call onDataChange
    } catch (error) {
      toast.error("Failed to update section visibility.");
      console.error("Error toggling visibility:", error);
    } finally {
      setIsTogglingVisibility(null);
    }
  };

  // Reorder sections
  const handleReorder = async (newSections: PrismaSection[]) => {
    setIsReordering(true);
    try {
      await contextReorderSections(newSections);
      toast.success("Sections reordered successfully!");
      onDataChange?.(); // Call onDataChange
    } catch (error) {
      toast.error("Failed to reorder sections.");
      console.error("Error reordering sections:", error);
    } finally {
      setIsReordering(false);
    }
  };

  const moveSectionUp = (sectionId: string) => {
    const currentIndex = contextSections.findIndex((s) => s.id === sectionId);
    if (currentIndex > 0) {
      const newSections = Array.from(contextSections);
      const sectionToMove = newSections[currentIndex];
      const sectionToSwap = newSections[currentIndex - 1];

      // Swap them in the array copy
      newSections[currentIndex] = sectionToSwap;
      newSections[currentIndex - 1] = sectionToMove;

      // Update order for all sections
      const updatedSectionsWithNewOrder = newSections.map((s, index) => ({
        ...s,
        order: index,
      }));

      handleReorder(updatedSectionsWithNewOrder as PrismaSection[]);
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const currentIndex = contextSections.findIndex((s) => s.id === sectionId);
    if (currentIndex < contextSections.length - 1 && currentIndex !== -1) {
      const newSections = Array.from(contextSections);
      const sectionToMove = newSections[currentIndex];
      const sectionToSwap = newSections[currentIndex + 1];

      // Swap them in the array copy
      newSections[currentIndex] = sectionToSwap;
      newSections[currentIndex + 1] = sectionToMove;

      // Update order for all sections
      const updatedSectionsWithNewOrder = newSections.map((s, index) => ({
        ...s,
        order: index,
      }));

      handleReorder(updatedSectionsWithNewOrder as PrismaSection[]);
    }
  };

  // Add Section using context
  const handleAddSectionForm = async () => {
    if (!newSectionTitle.trim() || !newSectionSlug.trim()) {
      toast.error("Section Title and Slug are required.");
      return;
    }
    setIsAddingSection(true);
    try {
      const newOrder =
        contextSections.length > 0
          ? Math.max(...contextSections.map((s) => s.order)) + 1
          : 0;

      // Construct the new section object based on what contextAddSection likely expects
      // This should align with Prisma schema for creation (excluding id, createdAt, updatedAt)
      const newSectionData = {
        title: newSectionTitle.trim(),
        slug: newSectionSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        type: newSectionType,
        visible: true,
        order: newOrder,
        // textBlocks: [], // Prisma will handle default empty relations
        // imageBlocks: [],
        // ... other relations will be empty by default
      };

      // Explicitly type newSectionData if needed, or ensure contextAddSection is flexible
      // For example: const newSectionData: Omit<PrismaSection, 'id' | 'createdAt' | 'updatedAt'> = { ... }

      await contextAddSection(newSectionData as any); // Changed to as any to bypass linter error temporarily

      toast.success(`Section "${newSectionData.title}" added successfully!`);
      setNewSectionDialogOpen(false);
      setNewSectionTitle("");
      setNewSectionSlug("");
      setNewSectionType("custom"); // Reset to default type
      onDataChange?.(); // Call onDataChange
    } catch (error) {
      toast.error("Failed to add section.");
      console.error("Error adding section:", error);
    } finally {
      setIsAddingSection(false);
    }
  };

  // Open Edit Section Dialog
  const openEditSection = (section: SectionForManager) => {
    setSectionToEdit(section as PrismaSection);
    setEditSectionTitle(section.title);
    setEditSectionSlug(section.slug || "");
    setEditSectionDialogOpen(true);
  };

  // Update Section using context
  const handleUpdateSectionForm = async () => {
    if (!sectionToEdit) {
      toast.error("No section selected for editing.");
      return;
    }
    if (!editSectionTitle.trim()) {
      // Slug is not editable for now, so only title is checked
      toast.error("Section Title is required.");
      return;
    }
    setIsUpdatingSection(true);
    try {
      // Construct the updated section object
      // Include all fields from sectionToEdit and override changed ones
      // Slug is taken from sectionToEdit.slug as it's not editable in the form currently
      const updatedSectionData: Partial<PrismaSection> & { id: string } = {
        ...sectionToEdit, // Spread original section to keep all its properties
        id: sectionToEdit.id,
        title: editSectionTitle.trim(),
        // slug: editSectionSlug.trim(), // If slug were editable
      };

      await contextUpdateSection(updatedSectionData as PrismaSection);

      toast.success(
        `Section "${updatedSectionData.title}" updated successfully!`
      );
      setEditSectionDialogOpen(false);
      setSectionToEdit(null);
      setEditSectionTitle("");
      setEditSectionSlug("");
      onDataChange?.(); // Call onDataChange
    } catch (error) {
      toast.error("Failed to update section.");
      console.error("Error updating section:", error);
    } finally {
      setIsUpdatingSection(false);
    }
  };

  // Delete Section using context
  const handleDeleteSection = async () => {
    if (sectionToDeleteId === null) {
      toast.error("No section selected for deletion.");
      return;
    }
    setIsDeletingSection(true);
    try {
      const sectionTitle =
        contextSections.find((s) => s.id === sectionToDeleteId)?.title ||
        "the section";
      await contextDeleteSection(sectionToDeleteId);
      toast.success(`Section "${sectionTitle}" deleted successfully!`);
      setDeleteSectionDialogOpen(false);
      setSectionToDeleteId(null);
      onDataChange?.(); // Call onDataChange
    } catch (error) {
      toast.error("Failed to delete section.");
      console.error("Error deleting section:", error);
    } finally {
      setIsDeletingSection(false);
    }
  };

  // Confirm delete
  const confirmDeleteSection = (id: string) => {
    setSectionToDeleteId(id);
    setDeleteSectionDialogOpen(true);
  };

  if (!isAdmin) return null;

  if (sectionsLoading && !contextSections.length) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  if (sectionsError) {
    return (
      <div className="fixed bottom-18 right-4 z-50 p-4 bg-red-500 text-white rounded-md shadow-lg">
        Error loading sections: {sectionsError}
        <Button
          onClick={retryConnection}
          variant="ghost"
          size="sm"
          className="ml-2 text-white underline"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Floating button to open section manager */}
      <motion.div
        className="fixed bottom-18 right-4 z-50"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ delay: 0.5, type: "spring" }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center"
        >
          <Layers className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Section Manager Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Section Manager
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Font Selection Dropdown */}
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label htmlFor="global-font-select">Global Font Family</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedFont}
                  onValueChange={handleFontChange}
                  disabled={settingsLoading || isSavingFont}
                >
                  <SelectTrigger id="global-font-select">
                    <SelectValue placeholder="Select font..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="font-sans">
                      Sans-serif (Default)
                    </SelectItem>
                    <SelectItem value="font-serif">Serif</SelectItem>
                    <SelectItem value="font-mono">Monospace</SelectItem>
                    <SelectItem value="font-display">Display</SelectItem>
                    <SelectItem value="font-handwriting">Handwriting</SelectItem>
                    <SelectItem value="font-condensed">Condensed</SelectItem>
                    <SelectItem value="font-rounded">Rounded</SelectItem>
                    <SelectItem value="font-slab-serif">Slab-serif</SelectItem>
                  </SelectContent>
                </Select>
                {isSavingFont && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select the primary font for the website content.
              </p>
            </div>

            <div className="space-y-4">
              {contextSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3 border rounded-md ${
                      section.visible
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-100 dark:bg-gray-700 opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500" />
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {section.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ({section.type})
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSectionVisibility(section)}
                        title={
                          section.visible ? "Hide section" : "Show section"
                        }
                        disabled={isTogglingVisibility === section.id}
                      >
                        {isTogglingVisibility === section.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : section.visible ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} className="text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionUp(section.id)}
                        disabled={
                          isReordering ||
                          section.order === 0 ||
                          contextSections.length <= 1
                        }
                        title="Move up"
                      >
                        {isReordering &&
                        (contextSections.findIndex(
                          (s) => s.id === section.id
                        ) === section.order ||
                          contextSections.findIndex(
                            (s) => s.id === section.id
                          ) -
                            1 ===
                            section.order) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ArrowUp size={16} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionDown(section.id)}
                        disabled={
                          isReordering ||
                          section.order === contextSections.length - 1 ||
                          contextSections.length <= 1
                        }
                        title="Move down"
                      >
                        {isReordering &&
                        (contextSections.findIndex(
                          (s) => s.id === section.id
                        ) === section.order ||
                          contextSections.findIndex(
                            (s) => s.id === section.id
                          ) +
                            1 ===
                            section.order) ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ArrowDown size={16} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditSection(section)}
                        title="Edit section"
                      >
                        <Settings size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDeleteSection(section.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50"
                        title="Delete section"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setNewSectionDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add New Section
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog - Needs 'slug' input */}
      <Dialog
        open={newSectionDialogOpen}
        onOpenChange={setNewSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Section
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-type">Section Type</Label>
              <Select
                value={newSectionType}
                onValueChange={(value) =>
                  setNewSectionType(value as SectionType)
                }
              >
                <SelectTrigger id="section-type">
                  <SelectValue placeholder="Select section type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="testimonials">Testimonials</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="custom">Custom (Generic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={`Title (e.g. About Me)`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-slug">Section Slug</Label>
              <Input
                id="section-slug"
                value={newSectionSlug}
                onChange={(e) =>
                  setNewSectionSlug(
                    e.target.value.toLowerCase().replace(/\\s+/g, "-")
                  )
                }
                placeholder={`Slug (e.g. about-me)`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unique identifier for the section URL/linking. Use lowercase
                letters, numbers, and hyphens.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewSectionDialogOpen(false)}
              disabled={isAddingSection}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSectionForm} disabled={isAddingSection}>
              {isAddingSection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Add Section"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog - Needs 'slug' input */}
      <Dialog
        open={editSectionDialogOpen}
        onOpenChange={setEditSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Section (ID: {sectionToEdit?.id})
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-section-title">Section Title</Label>
              <Input
                id="edit-section-title"
                value={editSectionTitle}
                onChange={(e) => setEditSectionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-section-slug">Section Slug</Label>
              <Input
                id="edit-section-slug"
                value={editSectionSlug}
                onChange={(e) =>
                  setEditSectionSlug(
                    e.target.value.toLowerCase().replace(/\\s+/g, "-")
                  )
                }
                disabled
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Slug is typically not changed after creation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSectionDialogOpen(false)}
              disabled={isUpdatingSection}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSectionForm}
              disabled={isUpdatingSection}
            >
              {isUpdatingSection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Update Section"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation Dialog */}
      <Dialog
        open={deleteSectionDialogOpen}
        onOpenChange={setDeleteSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Section Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the section titled "
            <strong>
              {contextSections.find((s) => s.id === sectionToDeleteId)?.title ||
                "this section"}
            </strong>
            "? This action cannot be undone and may affect content linked to
            this section.
          </p>
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              variant="destructive"
              onClick={handleDeleteSection}
              disabled={isDeletingSection}
            >
              {isDeletingSection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteSectionDialogOpen(false)}
              disabled={isDeletingSection}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
