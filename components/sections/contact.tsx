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
import { Input } from "@/components/ui/input";
import { Label as InputLabel } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ImageBlock as PrismaImageBlock,
  ContactInfoItem as PrismaContactInfoItem,
} from "../../lib/generated/prisma";
import EditableTextAutoResize from "@/components/ui/editable-text-auto-resize";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";

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
  const sectionId = section.slug;
  const sectionAPId = section.id;

  const textBlock1 = section.textBlocks?.find(b => b.order === 0);
  const textBlock2 = section.textBlocks?.find(b => b.order === 1);
  const imageBlock1 = section.imageBlocks?.find(b => b.order === 0);
  const imageBlock2 = section.imageBlocks?.find(b => b.order === 1);
  const contactInfoItemsToRender = section.contactInfoItems || [];

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

  const [altTextImg1, setAltTextImg1] = useState(imageBlock1?.alt || "");
  const [altTextImg2, setAltTextImg2] = useState(imageBlock2?.alt || "");

  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      setAltTextImg1(imageBlock1?.alt || "");
      setAltTextImg2(imageBlock2?.alt || "");
    }
  }, [isAdmin, imageBlock1, imageBlock2]);

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

  const saveContactAPI = async () => {
    if (!contactValue.trim() || !contactType) {
      toast.error("Contact type and value are required.");
      return;
    }
    setIsSavingContact(true);

    const contactData = {
      sectionId: sectionAPId,
      type: contactType,
      value: contactValue,
      label: contactLabel.trim() || null,
    };

    try {
      let response;
      let url = "/api/contact-info";
      let method = "POST";

      if (currentContact) {
        url = `/api/contact-info/${currentContact.id}`;
        method = "PUT";
      }

      response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save contact info");
      }

      toast.success(`Contact info ${currentContact ? "updated" : "added"}!`);
      onDataChange();
      setContactDialogOpen(false);
    } catch (error) {
      console.error("Saving contact info failed:", error);
      toast.error(`Saving failed: ${(error as Error).message}`);
    } finally {
      setIsSavingContact(false);
    }
  };

  const confirmDeleteContact = (contactId: string) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  const deleteContactAPI = async () => {
    if (!contactToDelete) return;
    setIsDeletingContact(true);
    try {
      const response = await fetch(`/api/contact-info/${contactToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete contact info");
      }
      toast.success("Contact info deleted!");
      onDataChange();
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("Deleting contact info failed:", error);
      toast.error(`Deleting failed: ${(error as Error).message}`);
    } finally {
      setIsDeletingContact(false);
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormEmail || !contactFormSubject || !contactFormMessage) {
      toast.error("Please fill in all fields.");
      return;
    }
    setContactFormSubmitting(true);
    setContactFormSuccess(false);

    try {
      const response = await fetch("/api/contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: contactFormEmail,
          subject: contactFormSubject,
          message: contactFormMessage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send message");
      }

      toast.success("Message sent successfully!");
      setContactFormSuccess(true);
      setTimeout(() => {
        setContactFormOpen(false);
        setContactFormSuccess(false);
        setContactFormEmail("");
        setContactFormSubject("");
        setContactFormMessage("");
      }, 2000);
    } catch (error) {
      console.error("Contact form submission error:", error);
      toast.error(`Failed to send message: ${(error as Error).message}`);
    } finally {
      setContactFormSubmitting(false);
    }
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

  const handleSaveTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
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
        throw new Error(errorData.message || "Failed to save text block");
      }
      toast.success("Text block saved!");
      onDataChange();
    } catch (error) {
      console.error("Error saving text block in ContactSection:", error);
      toast.error(`Saving text block failed: ${(error as Error).message}`);
      throw error;
    }
  };

  const handleSaveImageBlock = async (
    blockId: string,
    data: { src?: string; alt?: string; publicId?: string }
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
      toast.success("Image block updated!");
      onDataChange();
    } catch (error) {
      console.error("Error saving image block in ContactSection:", error);
      toast.error(`Saving image block failed: ${(error as Error).message}`);
      throw error;
    }
  };

  const ensureImageBlockExistsAndSave = async (
    blockOrder: number,
    data: { src: string; alt: string; publicId: string }
  ) => {
    let block = section.imageBlocks?.find(b => b.order === blockOrder);
    if (!block) {
      try {
        const createRes = await fetch("/api/imageblocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId: sectionAPId,
            src: data.src,
            alt: data.alt,
            imagePublicId: data.publicId,
            order: blockOrder,
          }),
        });
        if (!createRes.ok) {
          const errorData = await createRes.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create image block");
        }
        const newBlock = await createRes.json();
        block = newBlock;
        toast.success("Image block created and updated!");
        onDataChange();
      } catch (error) {
        console.error(`Creating image block (order ${blockOrder}) failed:`, error);
        toast.error(`Failed to create image: ${(error as Error).message}`);
        return;
      }
    } else {
      await handleSaveImageBlock(block.id, {src: data.src, alt: data.alt, publicId: data.publicId });
    }
  };

  const sortedContactInfo = contactInfoItemsToRender.sort(
    (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity)
  );

  return (
    <footer
      id={sectionId}
      className="py-16 md:py-20 lg:py-24 bg-red-600 text-white"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-12">
          <AnimatedSection delay={0.1}>
            <h2 className="text-white font-bold tracking-tighter leading-none">
              <EditableTextAutoResize
                initialText={section.title || "LET'S WORK TOGETHER"}
                as="span"
                className="text-7xl sm:text-8xl md:text-9xl lg:text-[135px]"
              />
            </h2>
            <div className="flex mt-4 ml-1">
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="md:col-span-3 flex items-center justify-center md:justify-start">
            <AnimatedSection delay={0.2} variant="fadeInLeft">
              <CldUploadWidget
                uploadPreset="portfolio_unsigned"
                options={{ sources: ["local", "url"], multiple: false, folder: "contact_images" }}
                onSuccess={async (results: CloudinaryUploadWidgetResults) => {
                  if (results?.info && typeof results.info !== "string" && results.info.public_id) {
                    const { public_id, secure_url, original_filename } = results.info;
                    await ensureImageBlockExistsAndSave(0, {
                       src: secure_url, alt: original_filename || "Contact image 1", publicId: public_id
                    });
                  }
                }}
              >
                {({ open }) => (
                  <img
                    src={imageBlock1?.src || "https://picsum.photos/seed/contact1/300/400"}
                    alt={altTextImg1 || "Contact image 1"}
                    width={300}
                    height={400}
                    className={`rounded-xl shadow-lg object-cover ${isAdmin ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                    onClick={() => { if (isAdmin) open && open(); }}
                  />
                )}
              </CldUploadWidget>
            </AnimatedSection>
          </div>

          <div className="md:col-span-5 flex flex-col justify-center space-y-6">
            <AnimatedSection delay={0.3} variant="fadeInUp">
              {textBlock1 ? (
                <EditableText
                  key={textBlock1.id}
                  initialText={textBlock1.content}
                  className="text-sm text-white"
                  initialFontSize={textBlock1.fontSize || 14}
                  initialFontFamily={textBlock1.fontFamily || "font-sans"}
                  blockId={textBlock1.id}
                  onCommitText={handleSaveTextBlock}
                />
              ) : isAdmin ? (
                <div className="text-center text-white/50 p-4 border border-dashed border-white/30 rounded-md">
                  Text block 1 missing.
                </div>
              ) : null}
            </AnimatedSection>
            <AnimatedSection delay={0.4} variant="fadeInUp">
              {textBlock2 ? (
                <EditableText
                  key={textBlock2.id}
                  initialText={textBlock2.content}
                  className="text-sm text-white"
                  initialFontSize={textBlock2.fontSize || 14}
                  initialFontFamily={textBlock2.fontFamily || "font-sans"}
                  blockId={textBlock2.id}
                  onCommitText={handleSaveTextBlock}
                />
              ) : isAdmin ? (
                 <div className="text-center text-white/50 p-4 border border-dashed border-white/30 rounded-md">
                  Text block 2 missing.
                </div>
              ) : null}
            </AnimatedSection>
          </div>

          <div className="md:col-span-4">
            <AnimatedSection delay={0.5} variant="fadeInRight">
              <div className="bg-red-700/50 backdrop-blur-sm rounded-xl shadow-xl p-6">
                <CldUploadWidget
                  uploadPreset="portfolio_unsigned"
                  options={{ sources: ["local", "url"], multiple: false, folder: "contact_images" }}
                  onSuccess={async (results: CloudinaryUploadWidgetResults) => {
                    if (results?.info && typeof results.info !== "string" && results.info.public_id) {
                      const { public_id, secure_url, original_filename } = results.info;
                       await ensureImageBlockExistsAndSave(1, {
                         src: secure_url, alt: original_filename || "Contact image 2", publicId: public_id
                      });
                    }
                  }}
                >
                  {({ open }) => (
                    <img
                      src={imageBlock2?.src || "https://picsum.photos/seed/contact2/400/300"}
                      alt={altTextImg2 || "Contact image 2"}
                      width={400}
                      height={300}
                      className={`rounded-lg shadow-md object-cover mb-6 w-full ${isAdmin ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                      onClick={() => { if (isAdmin) open && open(); }}
                    />
                  )}
                </CldUploadWidget>
                
                <div className="space-y-3 mb-6">
                  {sortedContactInfo.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between group"
                    >
                      <a
                        href={formatContactLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:opacity-80 transition-opacity text-sm"
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/10 mr-2.5">
                          {getContactIcon(item.type)}
                        </span>
                        <span>{item.label || item.value}</span>
                      </a>
                      {isAdmin && (
                        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-blue-300 hover:text-blue-100 p-0.5"
                            onClick={() => openEditContactDialog(item)}
                            title="Edit Contact Info"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-300 hover:text-red-100 p-0.5"
                            onClick={() => confirmDeleteContact(item.id)}
                            title="Delete Contact Info"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  {isAdmin && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={openAddContactDialog}
                      className="w-full sm:w-auto"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Add Contact
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setContactFormOpen(true)}
                     className={`w-full ${isAdmin ? 'sm:w-auto' : 'sm:w-full'}`}
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
              <InputLabel htmlFor="contact-type" className="text-right">
                Type
              </InputLabel>
              <select
                id="contact-type"
                value={contactType}
                onChange={(e) =>
                  setContactType(
                    e.target.value as PrismaContactInfoItem["type"]
                  )
                }
                className="col-span-3 w-full p-2 border rounded bg-white text-black dark:bg-gray-700 dark:text-white dark:border-gray-600"
                disabled={isSavingContact}
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="github">GitHub</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <InputLabel htmlFor="contactValue" className="text-right">
                Value <span className="text-red-500">*</span>
              </InputLabel>
              <Input
                id="contactValue"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="col-span-3"
                disabled={isSavingContact}
                required
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
                disabled={isSavingContact}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
              disabled={isSavingContact}
            >
              Cancel
            </Button>
            <Button
              onClick={saveContactAPI}
              disabled={isSavingContact || !contactValue.trim()}
            >
              {isSavingContact && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSavingContact ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button
              variant="destructive"
              onClick={deleteContactAPI}
              disabled={isDeletingContact}
            >
              {isDeletingContact && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isDeletingContact ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingContact}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  disabled={contactFormSubmitting}
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
                  disabled={contactFormSubmitting}
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
                  disabled={contactFormSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setContactFormOpen(false)}
                type="button"
                disabled={contactFormSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={contactFormSubmitting || contactFormSuccess}
              >
                {contactFormSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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
