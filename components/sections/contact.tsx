"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import EditableText from "@/components/ui/editable-text";
import EditableImage from "@/components/ui/editable-image";
import EditablePortrait from "@/components/ui/editable-portrait";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/animated-section";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  PlusCircle,
  Trash2,
  Mail,
  Phone,
  Facebook,
  Linkedin,
  Instagram,
  Twitter,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  Pencil,
  ImagePlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label as InputLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ImageBlock as PrismaImageBlock,
  ContactInfoItem as PrismaContactInfoItem,
} from "../../lib/generated/prisma";
import EditableTextAutoResize from "@/components/ui/editable-text-auto-resize";

interface ContactSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    imageBlocks: PrismaImageBlock[];
    contactInfoItems: PrismaContactInfoItem[];
  };
  onDataChange: () => void;
}

export default function ContactSection({
  section,
  onDataChange,
}: ContactSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const sectionId = section.id;

  const textBlock1 = section.textBlocks?.[0];
  const textBlock2 = section.textBlocks?.[1];
  const imageBlock1 = section.imageBlocks?.[0];
  const imageBlock2 = section.imageBlocks?.[1];
  const contactInfoItemsToRender = section.contactInfoItems || [];

  const [showPortrait, setShowPortrait] = useState(true);
  const [portraitPosition, setPortraitPosition] = useState<
    "left" | "center" | "right"
  >("right");

  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] =
    useState<PrismaContactInfoItem | null>(null);
  const [contactType, setContactType] =
    useState<PrismaContactInfoItem["type"]>("email");
  const [contactValue, setContactValue] = useState("");
  const [contactLabel, setContactLabel] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactFormEmail, setContactFormEmail] = useState("");
  const [contactFormSubject, setContactFormSubject] = useState("");
  const [contactFormMessage, setContactFormMessage] = useState("");
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);

  const [deleteBlockConfirm, setDeleteBlockConfirm] = useState<{
    type: "text" | "image";
    id: string;
  } | null>(null);
  const [editingBlock, setEditingBlock] = useState<{
    type: "text" | "image";
    id: string;
    currentContent?: string;
    currentSrc?: string;
    currentAlt?: string;
  } | null>(null);
  const [editText, setEditText] = useState("");
  const [editImageSrc, setEditImageSrc] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");

  useEffect(() => {
    const storedFooterPortraitVisibility = localStorage.getItem(
      "portfolio-footer-portrait-visibility"
    );
    if (storedFooterPortraitVisibility !== null) {
      setShowPortrait(storedFooterPortraitVisibility === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "portfolio-footer-portrait-visibility",
      showPortrait.toString()
    );
  }, [showPortrait]);

  const openAddContactDialog = () => {
    setCurrentContact(null);
    setContactType("email");
    setContactValue("");
    setContactLabel("");
    setContactDialogOpen(true);
  };

  const openEditContactDialog = (contact: PrismaContactInfoItem) => {
    setCurrentContact(contact);
    setContactType(contact.type);
    setContactValue(contact.value);
    setContactLabel(contact.label || "");
    setContactDialogOpen(true);
  };

  const saveContact = () => {
    console.log("Save contact clicked (API call needed)", {
      currentContact,
      contactType,
      contactValue,
      contactLabel,
    });
    setContactDialogOpen(false);
  };

  const confirmDeleteContact = (contactId: string) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const deleteContact = () => {
    console.log("Delete contact clicked (API call needed)", contactToDelete);
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormSubmitting(true);
    setTimeout(() => {
      setContactFormSubmitting(false);
      setContactFormSuccess(true);
      setTimeout(() => {
        setContactFormOpen(false);
        setContactFormSuccess(false);
        setContactFormEmail("");
        setContactFormSubject("");
        setContactFormMessage("");
      }, 2000);
    }, 1500);
  };

  const getContactIcon = (type: PrismaContactInfoItem["type"]) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "website":
        return <Globe className="h-5 w-5" />;
      default:
        return <ExternalLink className="h-5 w-5" />;
    }
  };

  const formatContactLink = (item: PrismaContactInfoItem): string => {
    switch (item.type) {
      case "email":
        return `mailto:${item.value}`;
      case "phone":
        return `tel:${item.value}`;
      case "linkedin":
      case "facebook":
      case "instagram":
      case "twitter":
      case "github":
      case "website":
        return item.value.startsWith("http")
          ? item.value
          : `https://${item.value}`;
      default:
        return item.value;
    }
  };

  const handleAddTextBlock = async () => {
    const content = prompt("Enter new text content:", "New contact text...");
    if (content === null) return;
    try {
      const res = await fetch("/api/textblocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content }),
      });
      if (!res.ok) throw new Error("Failed to add text block");
      onDataChange();
    } catch (error) {
      console.error(error); /* Add user feedback */
    }
  };

  const handleAddImageBlock = async () => {
    const src = prompt("Enter image URL:", "https://picsum.photos/400/300");
    if (!src) return;
    const alt = prompt("Enter image alt text (optional):");
    try {
      const res = await fetch("/api/imageblocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, src, alt: alt || "" }), // Ensure alt is string
      });
      if (!res.ok) throw new Error("Failed to add image block");
      onDataChange();
    } catch (error) {
      console.error(error); /* Add user feedback */
    }
  };

  const handleSaveTextBlock = async (blockId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save text block");
      }
      setEditingBlock(null);
      onDataChange();
    } catch (error) {
      console.error("Error saving text block in ContactSection:", error);
      throw error;
    }
  };

  const handleSaveImageBlock = async (
    blockId: string,
    data: { src?: string; alt?: string }
  ) => {
    try {
      const res = await fetch(`/api/imageblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save image block");
      }
      setEditingBlock(null);
      onDataChange();
    } catch (error) {
      console.error("Error saving image block in ContactSection:", error);
      throw error;
    }
  };

  const startEditText = (block: PrismaTextBlock) => {
    setEditingBlock({ type: "text", id: block.id });
    setEditText(block.content || "");
  };

  const startEditImage = (block: PrismaImageBlock) => {
    setEditingBlock({ type: "image", id: block.id });
    setEditImageSrc(block.src || "");
    setEditImageAlt(block.alt || "");
  };

  const cancelEdit = () => {
    setEditingBlock(null);
  };

  return (
    <footer
      id={section.id}
      className="py-16 md:py-20 lg:py-24 bg-red-600 text-white"
    >
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row */}
        <div className="mb-12">
          <AnimatedSection delay={0.1}>
            <h2 className="text-white font-bold tracking-tighter leading-none">
              <EditableText
                initialText={section.title || "LET'S WORK TOGETHER"}
                as="span"
                initialFontSize={90}
                // blockId={`section-title-${section.id}`}
                // onSave={async (id, newTitle) => {
                //   console.log(
                //     "Section title save attempt (not implemented):",
                //     id,
                //     newTitle
                //   );
                // }}
                // isAdmin={isAdmin}
              />
            </h2>
            <div className="flex mt-4 ml-1">
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </AnimatedSection>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 relative">
          {/* Portrait Image - Only shown if showPortrait is true */}
          {showPortrait && (
            <div className="md:col-span-4 lg:col-span-3 order-2 md:order-1">
              <AnimatedSection delay={0.2} variant="fadeInRight">
                <EditablePortrait
                  initialSrc={
                    imageBlock2?.src || "/placeholder.svg?height=400&width=300"
                  }
                  alt={imageBlock2?.alt || "Footer portrait"}
                  width={300}
                  height={400}
                  onPositionChange={setPortraitPosition}
                  currentPosition={portraitPosition}
                />
              </AnimatedSection>
            </div>
          )}

          {/* Content Column */}
          <div
            className={`${
              showPortrait ? "md:col-span-8 lg:col-span-9" : "md:col-span-12"
            } order-1 md:order-2`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedSection delay={0.3} variant="fadeInLeft">
                <div className="bg-red-700/30 backdrop-blur-sm rounded-lg p-6 shadow-md min-h-[150px]">
                  {textBlock1 ? (
                    <EditableText
                      key={textBlock1.id}
                      // blockId={textBlock1.id}
                      // onSave={handleSaveTextBlock}
                      // isAdmin={isAdmin}
                      initialText={textBlock1.content}
                      className="text-sm mb-4 text-white"
                      initialFontSize={14}
                    />
                  ) : isAdmin ? (
                    <div className="text-center text-white/50">
                      Text block 1 missing.
                    </div>
                  ) : null}
                </div>
              </AnimatedSection>
              <AnimatedSection delay={0.5} variant="fadeInLeft">
                <div className="bg-red-700/30 backdrop-blur-sm rounded-lg p-6 shadow-md">
                  <div className="mb-4 min-h-[150px]">
                    {imageBlock1 ? (
                      <EditableImage
                        key={imageBlock1.id}
                        src={imageBlock1.src}
                        alt={imageBlock1.alt || "Contact image"}
                        width={400}
                        height={300}
                        // onSave={handleSaveImageBlock}
                        // isAdmin={isAdmin}
                        className="w-full h-auto object-cover rounded-lg shadow-md"
                      />
                    ) : isAdmin ? (
                      <div className="text-center text-white/50">
                        Image block 1 missing.
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-3 mb-6">
                    {contactInfoItemsToRender.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between group"
                      >
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-2">
                            {getContactIcon(item.type)}
                          </span>
                          <span>{item.value}</span>
                        </div>
                        {isAdmin && (
                          <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-blue-300 hover:text-blue-100"
                              onClick={() => openEditContactDialog(item)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-300 hover:text-red-100"
                              onClick={() => confirmDeleteContact(item.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    {isAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={openAddContactDialog}
                      >
                        <PlusCircle size={16} className="mr-2" />
                        Add Contact Info
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setContactFormOpen(true)}
                    >
                      <Send size={16} className="mr-2" />
                      Contact Me
                    </Button>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>

        {/* Controls Row */}
        {isAdmin && (
          <div className="mt-8">
            <AnimatedSection delay={0.7}>
              <div className="flex items-center space-x-2">
                <Switch
                  id="footer-portrait-toggle"
                  checked={showPortrait}
                  onCheckedChange={setShowPortrait}
                />
                <Label
                  htmlFor="footer-portrait-toggle"
                  className="flex items-center gap-2"
                >
                  {showPortrait ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Hide Portrait</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Show Portrait</span>
                    </>
                  )}
                </Label>
              </div>
            </AnimatedSection>
          </div>
        )}
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentContact ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
            <DialogDescription>
              {currentContact
                ? "Update your contact information"
                : "Add a new contact method to your portfolio"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <InputLabel htmlFor="contact-type">Type</InputLabel>
              <select
                id="contact-type"
                value={contactType}
                onChange={(e) =>
                  setContactType(
                    e.target.value as PrismaContactInfoItem["type"]
                  )
                }
                className="w-full p-2 border rounded bg-white text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <InputLabel htmlFor="contactValue" className="text-right">
                Value
              </InputLabel>
              <Input
                id="contactValue"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <InputLabel htmlFor="contactLabel" className="text-right">
                Label (Optional)
              </InputLabel>
              <Input
                id="contactLabel"
                value={contactLabel}
                onChange={(e) => setContactLabel(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Work Email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveContact} disabled={!contactValue}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact information? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={deleteContact}>
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog */}
      <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Contact Me</DialogTitle>
            <DialogDescription>
              Fill out the form below to send me a message. I'll get back to you
              as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <InputLabel htmlFor="email" className="text-right">
                  Your Email
                </InputLabel>
                <Input
                  id="email"
                  type="email"
                  value={contactFormEmail}
                  onChange={(e) => setContactFormEmail(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <InputLabel htmlFor="subject" className="text-right">
                  Subject
                </InputLabel>
                <Input
                  id="subject"
                  value={contactFormSubject}
                  onChange={(e) => setContactFormSubject(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <InputLabel htmlFor="message" className="text-right">
                  Message
                </InputLabel>
                <Textarea
                  id="message"
                  value={contactFormMessage}
                  onChange={(e) => setContactFormMessage(e.target.value)}
                  className="col-span-3 min-h-[120px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setContactFormOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={contactFormSubmitting}>
                {contactFormSubmitting
                  ? "Sending..."
                  : contactFormSuccess
                  ? "Sent!"
                  : "Send Message"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
