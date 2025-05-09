"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  StarHalf,
  Plus,
  AlertCircle,
  Quote,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AnimatedSection from "../ui/animated-section";
import { useAuth } from "@/context/auth-context";
import TestimonialCard from "../ui/testimonial-card";
import EditableText from "../ui/editable-text";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { toast } from "sonner";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  TestimonialItem as PrismaTestimonialItem,
} from "../../lib/generated/prisma";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import Image from "next/image";

// Define testimonial type
export interface Testimonial {
  id: string;
  clientName: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  imageSrc?: string;
  imagePublicId?: string;
  order?: number;
}

// Add props for the section data
interface TestimonialsSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    testimonialItems?: PrismaTestimonialItem[];
  };
  onDataChange: () => void;
}

export default function TestimonialsSection({
  section,
  onDataChange,
}: TestimonialsSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];
  const sectionId = section.slug;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(
    null
  );
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);

  // Form state
  const [formClientName, setFormClientName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRating, setFormRating] = useState(5);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Loading states
  const [isSavingTestimonialText, setIsSavingTestimonialText] = useState(false);
  const [isSavingTestimonialAvatar, setIsSavingTestimonialAvatar] =
    useState(false);
  const [isDeletingTestimonial, setIsDeletingTestimonial] = useState(false);
  const [isSavingIntro, setIsSavingIntro] = useState(false);

  const handleSaveSectionTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    setIsSavingIntro(true);
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
          errorData.message || "Failed to save section intro text"
        );
      }
      toast.success("Section intro text saved!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error saving section intro text:", error);
      toast.error(`Failed to save intro: ${(error as Error).message}`);
    } finally {
      setIsSavingIntro(false);
    }
  };

  useEffect(() => {
    const mappedTestimonials =
      section.testimonialItems
        ?.map(
          (item): Testimonial => ({
            id: String(item.id),
            clientName: item.clientName || "",
            role: item.role || "",
            company: item.company || "",
            content: item.content || "",
            rating: item.rating || 0,
            imageSrc: item.imageSrc || undefined,
            imagePublicId: item.imagePublicId || undefined,
            order: item.order !== null ? item.order : undefined,
          })
        )
        .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)) || [];
    setTestimonials(mappedTestimonials);
    if (
      mappedTestimonials.length > 0 &&
      currentIndex >= mappedTestimonials.length
    ) {
      setCurrentIndex(Math.max(0, mappedTestimonials.length - 1));
    } else if (mappedTestimonials.length === 0) {
      setCurrentIndex(0);
    }
  }, [section.testimonialItems, currentIndex]);

  // Navigate to previous testimonial
  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next testimonial
  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Open dialog to add new testimonial
  const openAddDialog = () => {
    setEditingTestimonial(null);
    setFormClientName("");
    setFormRole("");
    setFormCompany("");
    setFormContent("");
    setFormRating(5);
    setDialogOpen(true);
  };

  // Open dialog to edit testimonial
  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormClientName(testimonial.clientName);
    setFormRole(testimonial.role);
    setFormCompany(testimonial.company);
    setFormContent(testimonial.content);
    setFormRating(testimonial.rating);
    setDialogOpen(true);
  };

  // Confirm delete testimonial
  const confirmDelete = (id: string) => {
    setTestimonialToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Delete testimonial
  const deleteTestimonialAPI = async () => {
    if (testimonialToDelete === null) return;
    setIsDeletingTestimonial(true);
    try {
      const response = await fetch(`/api/testimonials/${testimonialToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete testimonial");
      }
      toast.success("Testimonial deleted!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Deleting testimonial failed:", error);
      toast.error(`Deleting failed: ${(error as Error).message}`);
    } finally {
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      setIsDeletingTestimonial(false);
    }
  };

  // Save testimonial (add or edit TEXT content only)
  const saveTestimonialTextData = async () => {
    if (!formClientName || !formContent) {
      toast.error("Client Name and Testimonial content are required.");
      return;
    }

    setIsSavingTestimonialText(true);
    const testimonialData: Partial<PrismaTestimonialItem> & {
      sectionId?: string;
    } = {
      sectionId: editingTestimonial ? undefined : section.id,
      clientName: formClientName,
      role: formRole,
      company: formCompany,
      content: formContent,
      rating: formRating,
    };

    // Remove null/undefined values unless explicitly allowed by API/Prisma
    Object.keys(testimonialData).forEach((key) => {
      const typedKey = key as keyof typeof testimonialData;
      if (testimonialData[typedKey] === undefined) {
        delete testimonialData[typedKey];
      }
    });

    try {
      let response;
      let url = "/api/testimonials";
      let method = "POST";

      if (editingTestimonial) {
        url = `/api/testimonials/${editingTestimonial.id}`;
        method = "PUT";
        delete testimonialData.sectionId; // Don't send sectionId on PUT
      }

      response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testimonialData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save testimonial");
      }

      toast.success(`Testimonial ${editingTestimonial ? "updated" : "added"}!`);
      if (onDataChange) onDataChange();
      setDialogOpen(false);
    } catch (error) {
      console.error("Saving testimonial failed:", error);
      toast.error(`Saving failed: ${(error as Error).message}`);
    } finally {
      setIsSavingTestimonialText(false);
    }
  };

  // Handler for when a testimonial avatar is uploaded via EditableImage in TestimonialCard
  const handleTestimonialAvatarUploaded = async (
    testimonialId: string,
    imageData: { public_id: string; secure_url: string }
  ) => {
    setIsSavingTestimonialAvatar(true);
    try {
      const payload = {
        imageSrc: imageData.secure_url,
        imagePublicId: imageData.public_id,
      };
      const response = await fetch(`/api/testimonials/${testimonialId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to update testimonial avatar"
        );
      }
      toast.success("Testimonial avatar updated!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error(
        `Error updating avatar for testimonial ${testimonialId}:`,
        error
      );
      toast.error(`Avatar update failed: ${(error as Error).message}`);
    } finally {
      setIsSavingTestimonialAvatar(false);
    }
  };

  // Render star rating
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`star-${i}`}
          className="h-4 w-4 fill-current text-yellow-400"
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf
          key="half-star"
          className="h-4 w-4 fill-current text-yellow-400"
        />
      );
    }

    return stars;
  };

  return (
    <section
      id={sectionId}
      className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-gray-100 dark:bg-gray-950"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Title Column */}
          <div className="lg:col-span-4">
            <AnimatedSection delay={0.1}>
              <EditableTextAutoResize
                initialText={section.title || "TESTIMONIALS"}
                as="h1"
                className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-4 md:mb-6"
              />
              {introTextBlock && (
                <EditableText
                  initialText={introTextBlock.content}
                  className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed"
                  as="p"
                  blockId={introTextBlock.id}
                  onCommitText={handleSaveSectionTextBlock}
                  initialFontSize={introTextBlock.fontSize || 14}
                  initialFontFamily={introTextBlock.fontFamily || "font-sans"}
                />
              )}
              {!introTextBlock && isAdmin && (
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  Intro text block missing.
                </p>
              )}
            </AnimatedSection>
          </div>

          {/* Testimonial Carousel Column */}
          <div className="lg:col-span-8">
            <div className="relative">
              {/* Testimonial Cards */}
              <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                  {testimonials.length > 0 ? (
                    <motion.div
                      key={`testimonial-${currentIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-full"
                    >
                      <TestimonialCard
                        testimonial={testimonials[currentIndex]}
                        onEdit={
                          isAdmin
                            ? () => openEditDialog(testimonials[currentIndex])
                            : undefined
                        }
                        onDelete={
                          isAdmin
                            ? () => confirmDelete(testimonials[currentIndex].id)
                            : undefined
                        }
                        isAdmin={isAdmin}
                        uploadPreset="portfolio_unsigned"
                        onAvatarUploaded={handleTestimonialAvatarUploaded}
                      />
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        No testimonials yet.{" "}
                        {isAdmin && "Click below to add one!"}
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              {testimonials.length > 1 && (
                <div className="flex justify-between mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevTestimonial}
                      className="rounded-full border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-700/20"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span className="sr-only">Previous testimonial</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextTestimonial}
                      className="rounded-full border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-700/20"
                    >
                      <ChevronRight className="h-5 w-5" />
                      <span className="sr-only">Next testimonial</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {testimonials.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex
                            ? "bg-red-600 dark:bg-red-500"
                            : "bg-gray-300 dark:bg-gray-600 hover:bg-red-300 dark:hover:bg-red-400"
                        }`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Testimonial Button (Admin only) */}
              {isAdmin && (
                <motion.div
                  className="mt-8 flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: testimonials.length > 0 ? 0.2 : 0.5,
                    duration: 0.3,
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={openAddDialog}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-700/20 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Testimonial
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Testimonial Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              {editingTestimonial
                ? "Update the testimonial information below."
                : "Add a new client testimonial to showcase on your portfolio."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  placeholder="John Smith"
                  disabled={isSavingTestimonialText}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Position</Label>
                <Input
                  id="role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="CEO"
                  disabled={isSavingTestimonialText}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Acme Inc."
                disabled={isSavingTestimonialText}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Testimonial <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="What the client said about your work..."
                className="min-h-[120px]"
                disabled={isSavingTestimonialText}
              />
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((ratingValue) => (
                  <button
                    key={`rating-${ratingValue}`}
                    type="button"
                    onClick={() =>
                      !isSavingTestimonialText && setFormRating(ratingValue)
                    }
                    className="focus:outline-none disabled:opacity-50"
                    disabled={isSavingTestimonialText}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        ratingValue <= formRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {formRating} out of 5
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSavingTestimonialText}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTestimonialTextData}
              disabled={
                isSavingTestimonialText || !formClientName || !formContent
              }
            >
              {isSavingTestimonialText && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingTestimonial
                ? isSavingTestimonialText
                  ? "Saving..."
                  : "Save Changes"
                : isSavingTestimonialText
                  ? "Adding..."
                  : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this testimonial? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              variant="destructive"
              onClick={deleteTestimonialAPI}
              disabled={isDeletingTestimonial}
            >
              {isDeletingTestimonial && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isDeletingTestimonial ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingTestimonial}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
