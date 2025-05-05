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
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";

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

export interface Section {
  id: number;
  type: SectionType;
  title: string;
  visible: boolean;
  position: number;
  bgColor?: string;
}

export default function SectionManager() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // State for sections
  const [sections, setSections] = useState<Section[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newSectionDialogOpen, setNewSectionDialogOpen] = useState(false);
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);

  // New section form state
  const [newSectionType, setNewSectionType] = useState<SectionType>("custom");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionBgColor, setNewSectionBgColor] = useState("#f3f4f6");

  // Edit section form state
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [editSectionBgColor, setEditSectionBgColor] = useState("");

  // Load sections from localStorage on component mount
  useEffect(() => {
    const savedSections = localStorage.getItem("portfolioSections");
    if (savedSections) {
      setSections(JSON.parse(savedSections));
    } else {
      // Default sections if none exist
      const defaultSections: Section[] = [
        { id: 1, type: "hero", title: "Hero", visible: true, position: 1 },
        {
          id: 2,
          type: "introduction",
          title: "Introduction",
          visible: true,
          position: 2,
        },
        {
          id: 3,
          type: "education",
          title: "Education",
          visible: true,
          position: 3,
        },
        { id: 4, type: "skills", title: "Skills", visible: true, position: 4 },
        {
          id: 5,
          type: "experience",
          title: "Experience",
          visible: true,
          position: 5,
        },
        {
          id: 6,
          type: "projects",
          title: "Projects",
          visible: true,
          position: 6,
        },
      ];
      setSections(defaultSections);
      localStorage.setItem(
        "portfolioSections",
        JSON.stringify(defaultSections)
      );
    }
  }, []);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    if (sections.length > 0) {
      localStorage.setItem("portfolioSections", JSON.stringify(sections));
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("sectionsUpdated"));
    }
  }, [sections]);

  // Toggle section visibility
  const toggleSectionVisibility = (id: number) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    );
  };

  // Move section up in order
  const moveSectionUp = (id: number) => {
    const sectionIndex = sections.findIndex((section) => section.id === id);
    if (sectionIndex > 0) {
      const newSections = [...sections];
      const currentPosition = newSections[sectionIndex].position;
      const prevPosition = newSections[sectionIndex - 1].position;

      newSections[sectionIndex].position = prevPosition;
      newSections[sectionIndex - 1].position = currentPosition;

      setSections(newSections.sort((a, b) => a.position - b.position));
    }
  };

  // Move section down in order
  const moveSectionDown = (id: number) => {
    const sectionIndex = sections.findIndex((section) => section.id === id);
    if (sectionIndex < sections.length - 1) {
      const newSections = [...sections];
      const currentPosition = newSections[sectionIndex].position;
      const nextPosition = newSections[sectionIndex + 1].position;

      newSections[sectionIndex].position = nextPosition;
      newSections[sectionIndex + 1].position = currentPosition;

      setSections(newSections.sort((a, b) => a.position - b.position));
    }
  };

  // Add a new section
  const addSection = () => {
    const newId = Math.max(...sections.map((section) => section.id), 0) + 1;
    const newPosition =
      Math.max(...sections.map((section) => section.position), 0) + 1;

    const newSection: Section = {
      id: newId,
      type: newSectionType,
      title:
        newSectionTitle ||
        `New ${
          newSectionType.charAt(0).toUpperCase() + newSectionType.slice(1)
        }`,
      visible: true,
      position: newPosition,
      bgColor: newSectionType === "custom" ? newSectionBgColor : undefined,
    };

    setSections([...sections, newSection]);
    setNewSectionDialogOpen(false);
    setNewSectionTitle("");
    setNewSectionType("custom");
    setNewSectionBgColor("#f3f4f6");
  };

  // Open edit section dialog
  const openEditSection = (section: Section) => {
    setSectionToEdit(section);
    setEditSectionTitle(section.title);
    setEditSectionBgColor(section.bgColor || "#f3f4f6");
    setEditSectionDialogOpen(true);
  };

  // Update section
  const updateSection = () => {
    if (!sectionToEdit) return;

    setSections(
      sections.map((section) =>
        section.id === sectionToEdit.id
          ? {
              ...section,
              title: editSectionTitle,
              bgColor:
                sectionToEdit.type === "custom"
                  ? editSectionBgColor
                  : section.bgColor,
            }
          : section
      )
    );
    setEditSectionDialogOpen(false);
    setSectionToEdit(null);
  };

  // Delete a section
  const deleteSection = () => {
    if (sectionToDelete === null) return;

    // Get the position of the section to delete
    const sectionToRemove = sections.find(
      (section) => section.id === sectionToDelete
    );
    if (!sectionToRemove) return;

    const positionToRemove = sectionToRemove.position;

    // Remove the section and update positions of remaining sections
    const updatedSections = sections
      .filter((section) => section.id !== sectionToDelete)
      .map((section) => {
        if (section.position > positionToRemove) {
          return { ...section, position: section.position - 1 };
        }
        return section;
      });

    setSections(updatedSections);
    setDeleteSectionDialogOpen(false);
    setSectionToDelete(null);
  };

  // Confirm delete
  const confirmDeleteSection = (id: number) => {
    setSectionToDelete(id);
    setDeleteSectionDialogOpen(true);
  };

  if (!isAdmin) return null;

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

          <div className="py-4">
            <div className="space-y-4">
              {sections
                .sort((a, b) => a.position - b.position)
                .map((section) => (
                  <div
                    key={section.id}
                    className={`flex items-center justify-between p-3 border rounded-md ${
                      section.visible ? "bg-white" : "bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          section.type === "custom" && section.bgColor
                            ? ""
                            : "bg-gray-400"
                        }`}
                        style={
                          section.type === "custom" && section.bgColor
                            ? { backgroundColor: section.bgColor }
                            : {}
                        }
                      />
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500">
                        ({section.type})
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSectionVisibility(section.id)}
                        title={
                          section.visible ? "Hide section" : "Show section"
                        }
                      >
                        {section.visible ? (
                          <Eye size={16} />
                        ) : (
                          <EyeOff size={16} className="text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionUp(section.id)}
                        disabled={section.position === 1}
                        title="Move up"
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSectionDown(section.id)}
                        disabled={section.position === sections.length}
                        title="Move down"
                      >
                        <ArrowDown size={16} />
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

      {/* Add Section Dialog */}
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
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section-title">Section Title</Label>
              <Input
                id="section-title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder={`New ${
                  newSectionType.charAt(0).toUpperCase() +
                  newSectionType.slice(1)
                }`}
              />
            </div>

            {newSectionType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="section-bg-color">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="section-bg-color"
                    type="color"
                    value={newSectionBgColor}
                    onChange={(e) => setNewSectionBgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={newSectionBgColor}
                    onChange={(e) => setNewSectionBgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewSectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addSection}>Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog
        open={editSectionDialogOpen}
        onOpenChange={setEditSectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Edit Section
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

            {sectionToEdit?.type === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="edit-section-bg-color">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="edit-section-bg-color"
                    type="color"
                    value={editSectionBgColor}
                    onChange={(e) => setEditSectionBgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={editSectionBgColor}
                    onChange={(e) => setEditSectionBgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditSectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateSection}>Update Section</Button>
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
          <p>
            Are you sure you want to delete this section? This action cannot be
            undone.
          </p>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={deleteSection}>
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteSectionDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
