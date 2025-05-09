"use client";

import type React from "react";
import { useState, useEffect } from "react";
import EditableText from "../ui/editable-text";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  GripVertical,
  ImagePlus,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "../ui/animated-section";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  SkillItem as PrismaSkillItem,
  SkillImage as PrismaSkillImage,
} from "../../lib/generated/prisma";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";

// Define a skill type
interface Skill {
  id: string;
  title: string;
  description: string;
  level?: number;
  titleBlockId?: string;
  descriptionBlockId?: string;
}

// Sortable Skill Item Component
function SortableSkillItem({
  skill,
  confirmDelete,
  index,
  isAdmin,
  onViewDetails,
}: {
  skill: Skill;
  confirmDelete: (id: string) => void;
  index: number;
  isAdmin: boolean | undefined;
  onViewDetails: (skill: Skill) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => {
        if (isAdmin) {
          onViewDetails(skill);
        }
      }}
      className={`flex items-start mb-6 sortable-item ${
        isAdmin ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""
      } ${isDragging ? "dragging" : ""}`}
    >
      {isAdmin && (
        <div
          className="mr-2 sortable-handle mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>
      )}
      <motion.div
        className="w-3 h-3 rounded-full bg-red-600 mt-1 mr-3 flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
      ></motion.div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-bold uppercase mb-2 text-base text-gray-800 dark:text-gray-200">
            {skill.title}
          </h3>
          {isAdmin && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-gray-400 hover:text-red-600 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(skill.id);
                }}
              >
                <Trash2 size={16} />
                <span className="sr-only">Delete skill</span>
              </Button>
            </motion.div>
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-400 whitespace-pre-line mt-1">
          {skill.description}
        </p>
      </div>
    </motion.div>
  );
}

interface SkillsSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    skillItems?: PrismaSkillItem[];
    skillImages?: PrismaSkillImage[];
  };
  onDataChange: () => void;
}

export default function SkillsSection({
  section,
  onDataChange,
}: SkillsSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];
  const sectionAPId = section.id;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillImages, setSkillImages] = useState<PrismaSkillImage[]>([]);

  const [deleteSkillDialogOpen, setDeleteSkillDialogOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
  const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);
  const [skillDetailDialogOpen, setSkillDetailDialogOpen] = useState(false);
  const [currentSkillInDialog, setCurrentSkillInDialog] =
    useState<Skill | null>(null);
  const [editedSkillTitle, setEditedSkillTitle] = useState("");
  const [editedSkillDescription, setEditedSkillDescription] = useState("");

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isDeletingSkill, setIsDeletingSkill] = useState(false);
  const [isReorderingSkills, setIsReorderingSkills] = useState(false);
  const [isSavingSkillDetails, setIsSavingSkillDetails] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isSavingSectionText, setIsSavingSectionText] = useState(false);

  useEffect(() => {
    setSkills(
      section.skillItems?.map((item) => ({
        id: String(item.id),
        title: item.title || "Untitled Skill",
        description: item.description || "",
        level: item.level || undefined,
      })) || []
    );
    setSkillImages(section.skillImages || []);
  }, [section.skillItems, section.skillImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSaveSectionTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    setIsSavingSectionText(true);
    try {
      const payload: {
        content: string;
        fontSize?: number;
        fontFamily?: string;
      } = { content: newContent };
      if (newFontSize !== undefined) payload.fontSize = newFontSize;
      if (newFontFamily !== undefined) payload.fontFamily = newFontFamily;
      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to save text block for section"
        );
      }
      toast.success("Section text block saved!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error saving section text block:", error);
      toast.error(
        `Failed to save section text block: ${(error as Error).message}`
      );
    } finally {
      setIsSavingSectionText(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      const oldIndex = skills.findIndex(
        (item) => String(item.id) === String(active.id)
      );
      const newIndex = skills.findIndex(
        (item) => String(item.id) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return;
      const reorderedItems = arrayMove(skills, oldIndex, newIndex);
      const orderedIds = reorderedItems.map((item) => item.id);
      setSkills(reorderedItems);
      setIsReorderingSkills(true);
      try {
        const response = await fetch(`/api/skills/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: sectionAPId, orderedIds }),
        });
        if (!response.ok) throw new Error("Failed to reorder skills");
        toast.success("Skills reordered!");
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Reordering skills failed:", error);
        toast.error(`Reordering skills failed: ${(error as Error).message}`);
        if (onDataChange) onDataChange();
      } finally {
        setIsReorderingSkills(false);
      }
    }
  };

  const addNewSkill = async () => {
    setIsAddingSkill(true);
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: sectionAPId,
          title: "New Skill",
          description: "Skill description",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add new skill");
      }
      toast.success("New skill added!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Adding skill failed:", error);
      toast.error(`Adding skill failed: ${(error as Error).message}`);
    } finally {
      setIsAddingSkill(false);
    }
  };

  const confirmDeleteSkillAction = (skillId: string) => {
    setSkillToDelete(skillId);
    setDeleteSkillDialogOpen(true);
  };

  const deleteSkill = async () => {
    if (skillToDelete === null) return;
    const idToDelete = skillToDelete;
    setIsDeletingSkill(true);
    setDeleteSkillDialogOpen(false);
    setSkillToDelete(null);
    try {
      const response = await fetch(`/api/skills/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete skill");
      }
      toast.success("Skill deleted!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error(`Deleting skill ${idToDelete} failed:`, error);
      toast.error(`Deleting skill failed: ${(error as Error).message}`);
      if (onDataChange) onDataChange();
    } finally {
      setIsDeletingSkill(false);
    }
  };

  const handleSkillImageUploadSuccess = async (
    results: CloudinaryUploadWidgetResults
  ) => {
    if (
      results?.info &&
      typeof results.info !== "string" &&
      results.info.public_id
    ) {
      const { public_id, secure_url, original_filename } = results.info;
      if (!isAddingImage) setIsAddingImage(true);
      try {
        const response = await fetch("/api/skill-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: sectionAPId,
            src: secure_url,
            alt: original_filename || "Skill image",
            imagePublicId: public_id,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to add skill image");
        }
        toast.success("Skill image added!");
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Adding skill image failed:", error);
        toast.error(`Adding skill image failed: ${(error as Error).message}`);
      } finally {
        setIsAddingImage(false);
      }
    } else {
      toast.error("Cloudinary upload failed or returned invalid data.");
      console.error("Cloudinary upload error/invalid data:", results);
      if (isAddingImage) setIsAddingImage(false);
    }
  };

  const confirmDeleteImageAction = (imageId: string) => {
    setImageToDeleteId(imageId);
    setDeleteImageDialogOpen(true);
  };

  const deleteSkillImage = async () => {
    if (imageToDeleteId === null) return;
    const idToDelete = imageToDeleteId;
    setIsDeletingImage(true);
    setDeleteImageDialogOpen(false);
    setImageToDeleteId(null);
    try {
      const response = await fetch(`/api/skill-images/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete skill image");
      }
      toast.success("Skill image deleted!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error(`Deleting skill image ${idToDelete} failed:`, error);
      toast.error(`Deleting skill image failed: ${(error as Error).message}`);
      if (onDataChange) onDataChange();
    } finally {
      setIsDeletingImage(false);
    }
  };

  const openSkillDetailDialog = (skill: Skill) => {
    setCurrentSkillInDialog(skill);
    setEditedSkillTitle(skill.title);
    setEditedSkillDescription(skill.description);
    setSkillDetailDialogOpen(true);
  };

  const saveSkillDetailsFromDialog = async () => {
    if (!currentSkillInDialog) return;
    const skillId = currentSkillInDialog.id;
    setIsSavingSkillDetails(true);
    try {
      const payload = {
        title: editedSkillTitle,
        description: editedSkillDescription,
      };
      const response = await fetch(`/api/skills/${skillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save skill details");
      }
      toast.success("Skill details saved!");
      if (onDataChange) onDataChange();
      setSkillDetailDialogOpen(false);
      setCurrentSkillInDialog(null);
    } catch (error) {
      console.error(`Error saving details for skill ${skillId}:`, error);
      toast.error(`Failed to save skill details: ${(error as Error).message}`);
    } finally {
      setIsSavingSkillDetails(false);
    }
  };

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={section.slug}
        className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-gray-100 dark:bg-gray-900"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "MY SKILLS"}
              as="h1"
              className="text-red-600 dark:text-red-500 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                key={introTextBlock.id}
                blockId={introTextBlock.id}
                initialText={introTextBlock.content}
                initialFontSize={introTextBlock.fontSize || 16}
                initialFontFamily={introTextBlock.fontFamily || "font-sans"}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                onCommitText={handleSaveSectionTextBlock}
              />
            )}
          </div>

          {/* Grid 2 card layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card trái: danh sách skill */}
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-center">
              {skills.length === 0 && !isAdmin && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No skills listed yet.
                </p>
              )}
              <ul className="space-y-6">
                {skills.map((skill, idx) => (
                  <li key={skill.id} className="flex items-start">
                    <span className="mt-2 mr-3 w-3 h-3 rounded-full bg-red-600 flex-shrink-0"></span>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white uppercase text-base mb-1">{skill.title}</div>
                      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {skill.description}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {isAdmin && (
                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={addNewSkill}
                    variant="outline"
                    className="dark:text-white"
                    disabled={isAddingSkill}
                  >
                    {isAddingSkill ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2 h-4 w-4" />
                    )}
                    {isAddingSkill ? "Adding..." : "Add Skill Item"}
                  </Button>
                </div>
              )}
            </div>
            {/* Card phải: Skill Images */}
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
              <div className="font-semibold text-gray-800 dark:text-white mb-4 text-lg">Skill Images</div>
              {isAdmin && (
                <CldUploadWidget
                  uploadPreset="portfolio_unsigned"
                  onSuccess={handleSkillImageUploadSuccess}
                  onUpload={() => setIsAddingImage(true)}
                  onError={() => setIsAddingImage(false)}
                  options={{
                    sources: ["local"],
                    multiple: false,
                    folder: "skill_images",
                  }}
                >
                  {({ open }) => (
                    <Button
                      variant="outline"
                      disabled={isAddingImage}
                      className="mb-4 dark:text-white"
                      onClick={() => open && open()}
                    >
                      {isAddingImage ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="mr-2 h-4 w-4" />
                      )}
                      {isAddingImage ? "Uploading..." : "Add New Skill Image"}
                    </Button>
                  )}
                </CldUploadWidget>
              )}
              {skillImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-4 mt-2">
                  {skillImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center p-2"
                    >
                      <Image
                        src={image.src}
                        alt={image.alt || "Skill image"}
                        width={160}
                        height={160}
                        className="object-cover w-full h-full rounded-md"
                      />
                      {isAdmin && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => confirmDeleteImageAction(String(image.id))}
                          disabled={isDeletingImage && imageToDeleteId === String(image.id)}
                          title="Delete image"
                        >
                          {isDeletingImage && imageToDeleteId === String(image.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  No skill images added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Delete Skill Confirmation Dialog */}
      <AnimatePresence>
        {deleteSkillDialogOpen && (
          <Dialog
            open={deleteSkillDialogOpen}
            onOpenChange={setDeleteSkillDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this skill item? This will not
                  delete associated images.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteSkill}
                  disabled={isDeletingSkill}
                >
                  {isDeletingSkill ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isDeletingSkill ? "Deleting..." : "Delete Skill"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteSkillDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Skill Image Confirmation Dialog */}
      <AnimatePresence>
        {deleteImageDialogOpen && (
          <Dialog
            open={deleteImageDialogOpen}
            onOpenChange={setDeleteImageDialogOpen}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Image Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this skill image? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteSkillImage}
                  disabled={isDeletingImage}
                >
                  {isDeletingImage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isDeletingImage ? "Deleting..." : "Delete Image"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteImageDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Skill Detail Edit Dialog (for text content) */}
      <AnimatePresence>
        {skillDetailDialogOpen && currentSkillInDialog && (
          <Dialog
            open={skillDetailDialogOpen}
            onOpenChange={setSkillDetailDialogOpen}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Skill</DialogTitle>
                <DialogDescription>
                  Update the details for "{currentSkillInDialog.title}".
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="skill-title-dialog" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="skill-title-dialog"
                    value={editedSkillTitle}
                    onChange={(e) => setEditedSkillTitle(e.target.value)}
                    className="col-span-3"
                    disabled={isSavingSkillDetails}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label
                    htmlFor="skill-description-dialog"
                    className="text-right"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="skill-description-dialog"
                    value={editedSkillDescription}
                    onChange={(e) => setEditedSkillDescription(e.target.value)}
                    className="col-span-3 min-h-[100px]"
                    disabled={isSavingSkillDetails}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSkillDetailDialogOpen(false)}
                  disabled={isSavingSkillDetails}
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveSkillDetailsFromDialog}
                  disabled={isSavingSkillDetails}
                >
                  {isSavingSkillDetails ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isSavingSkillDetails ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
