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
import { useSections, type AppSection } from "@/context/section-context";
import { useSettings } from "@/context/settings-context";
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

interface SectionManagerProps {}

export default function SectionManager({}: SectionManagerProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

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

  const {
    settings,
    updateSettings,
    isLoading: settingsLoadingContext,
  } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false);
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);

  const [sectionToEdit, setSectionToEdit] = useState<AppSection | null>(null);
  const [sectionToDeleteId, setSectionToDeleteId] = useState<string | null>(null);

  const [newSectionType, setNewSectionType] = useState<SectionType>("custom");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionSlug, setNewSectionSlug] = useState("");

  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionSlug, setEditSectionSlug] = useState("");

  const [isTogglingVisibility, setIsTogglingVisibility] = useState<string | null>(null);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isUpdatingSection, setIsUpdatingSection] = useState(false);
  const [isDeletingSection, setIsDeletingSection] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [selectedFont, setSelectedFont] = useState<string>("");
  const [isSavingFont, setIsSavingFont] = useState(false);

  useEffect(() => {
    if (settings?.globalFontFamily) {
      setSelectedFont(settings.globalFontFamily);
    }
  }, [settings?.globalFontFamily]);

  const handleFontChange = async (newFont: string) => {
    setSelectedFont(newFont);
    setIsSavingFont(true);
    try {
      await updateSettings({ globalFontFamily: newFont });
    } catch (error) {
      if (settings?.globalFontFamily) {
        setSelectedFont(settings.globalFontFamily);
      }
    } finally {
      setIsSavingFont(false);
    }
  };

  const toggleSectionVisibility = async (section: AppSection) => {
    setIsTogglingVisibility(section.id);
    try {
      const payload: Partial<AppSection> & { id: string } = {
        id: section.id,
        visible: !section.visible,
      };
      await contextUpdateSection(payload);
    } catch (error) {
      console.error("Error toggling visibility (SectionManager):", error);
    } finally {
      setIsTogglingVisibility(null);
    }
  };

  const handleReorder = async (newOrderedSections: AppSection[]) => {
    setIsReordering(true);
    const orderedIds = newOrderedSections.map(s => s.id);
    try {
      await contextReorderSections(orderedIds);
    } catch (error) {
      console.error("Error reordering sections (SectionManager):", error);
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
      newSections[currentIndex] = sectionToSwap;
      newSections[currentIndex - 1] = sectionToMove;
      const updatedSectionsWithNewOrder = newSections.map((s, index) => ({
        ...s,
        order: index,
      }));
      handleReorder(updatedSectionsWithNewOrder as AppSection[]);
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const currentIndex = contextSections.findIndex((s) => s.id === sectionId);
    if (currentIndex < contextSections.length - 1 && currentIndex !== -1) {
      const newSections = Array.from(contextSections);
      const sectionToMove = newSections[currentIndex];
      const sectionToSwap = newSections[currentIndex + 1];
      newSections[currentIndex] = sectionToSwap;
      newSections[currentIndex + 1] = sectionToMove;
      const updatedSectionsWithNewOrder = newSections.map((s, index) => ({
        ...s,
        order: index,
      }));
      handleReorder(updatedSectionsWithNewOrder as AppSection[]);
    }
  };

  const handleAddSectionForm = async () => {
    if (!newSectionTitle.trim() || !newSectionSlug.trim()) {
      toast.error("Section Title and Slug are required.");
      return;
    }
    setIsAddingSection(true);
    try {
      const newOrder = contextSections.length > 0 ? Math.max(...contextSections.map((s) => s.order)) + 1 : 0;
      const newSectionData = {
        title: newSectionTitle.trim(),
        slug: newSectionSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        type: newSectionType,
        visible: true,
        order: newOrder,
      };
      await contextAddSection(newSectionData as Omit<AppSection, "id" | "createdAt" | "updatedAt" | 'textBlocks' | 'imageBlocks' | 'contactInfoItems' | 'customSectionContentBlocks' | 'heroContent' | 'educationItems' | 'skillItems' | 'skillImages' | 'experienceItems' | 'projectItems' | 'testimonialItems'>);
      setNewSectionDialogOpen(false);
      setNewSectionTitle("");
      setNewSectionSlug("");
      setNewSectionType("custom");
    } catch (error) {
      console.error("Error adding section (SectionManager):", error);
    } finally {
      setIsAddingSection(false);
    }
  };

  const openEditSection = (section: AppSection) => {
    setSectionToEdit(section);
    setEditSectionTitle(section.title);
    setEditSectionSlug(section.slug || "");
    setEditSectionDialogOpen(true);
  };

  const handleUpdateSectionForm = async () => {
    if (!sectionToEdit) {
      toast.error("No section selected for editing.");
      return;
    }
    if (!editSectionTitle.trim()) {
      toast.error("Section Title is required.");
      return;
    }
    setIsUpdatingSection(true);
    try {
      const updatedSectionData: Partial<AppSection> & { id: string } = {
        id: sectionToEdit.id,
        title: editSectionTitle.trim(),
      };
      await contextUpdateSection(updatedSectionData);
      setEditSectionDialogOpen(false);
      setSectionToEdit(null);
      setEditSectionTitle("");
      setEditSectionSlug("");
    } catch (error) {
      console.error("Error updating section (SectionManager):", error);
    } finally {
      setIsUpdatingSection(false);
    }
  };

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
                  disabled={settingsLoadingContext || isSavingFont}
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
