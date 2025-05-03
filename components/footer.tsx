"use client";

import type React from "react";

import { useState } from "react";
import EditableText from "./ui/editable-text";
import EditableImage from "./ui/editable-image";
import { motion } from "framer-motion";
import AnimatedSection from "./ui/animated-section";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define contact type
interface ContactItem {
  id: number;
  type:
    | "email"
    | "phone"
    | "facebook"
    | "linkedin"
    | "instagram"
    | "twitter"
    | "other";
  value: string;
  label?: string;
}

export default function Footer() {
  // State for contact items
  const [contactItems, setContactItems] = useState<ContactItem[]>([
    { id: 1, type: "email", value: "hello@myportfolio.com" },
    { id: 2, type: "phone", value: "+123-456-7890" },
    { id: 3, type: "linkedin", value: "linkedin.com/in/myportfolio" },
  ]);

  // State for add/edit contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<ContactItem | null>(
    null
  );
  const [contactType, setContactType] = useState<ContactItem["type"]>("email");
  const [contactValue, setContactValue] = useState("");
  const [contactLabel, setContactLabel] = useState("");

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);

  // State for contact form dialog
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactFormEmail, setContactFormEmail] = useState("");
  const [contactFormSubject, setContactFormSubject] = useState("");
  const [contactFormMessage, setContactFormMessage] = useState("");
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);

  // Function to open add contact dialog
  const openAddContactDialog = () => {
    setCurrentContact(null);
    setContactType("email");
    setContactValue("");
    setContactLabel("");
    setContactDialogOpen(true);
  };

  // Function to open edit contact dialog
  const openEditContactDialog = (contact: ContactItem) => {
    setCurrentContact(contact);
    setContactType(contact.type);
    setContactValue(contact.value);
    setContactLabel(contact.label || "");
    setContactDialogOpen(true);
  };

  // Function to save contact
  const saveContact = () => {
    if (currentContact) {
      // Edit existing contact
      setContactItems(
        contactItems.map((item) =>
          item.id === currentContact.id
            ? {
                ...item,
                type: contactType,
                value: contactValue,
                label: contactLabel || undefined,
              }
            : item
        )
      );
    } else {
      // Add new contact
      const newContactId =
        contactItems.length > 0
          ? Math.max(...contactItems.map((item) => item.id)) + 1
          : 1;
      const newContact: ContactItem = {
        id: newContactId,
        type: contactType,
        value: contactValue,
        label: contactLabel || undefined,
      };
      setContactItems([...contactItems, newContact]);
    }
    setContactDialogOpen(false);
  };

  // Function to open delete confirmation dialog
  const confirmDeleteContact = (contactId: number) => {
    setContactToDelete(contactId);
    setDeleteDialogOpen(true);
  };

  // Function to delete a contact
  const deleteContact = () => {
    if (contactToDelete !== null) {
      setContactItems(
        contactItems.filter((item) => item.id !== contactToDelete)
      );
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  // Function to handle contact form submission
  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setContactFormSubmitting(false);
      setContactFormSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setContactFormOpen(false);
        setContactFormEmail("");
        setContactFormSubject("");
        setContactFormMessage("");
        setContactFormSuccess(false);
      }, 2000);
    }, 1500);
  };

  // Function to get icon for contact type
  const getContactIcon = (type: ContactItem["type"]) => {
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
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  return (
    <footer className="py-16 sm:py-10 lg:py-12 bg-black text-white border-t border-white/20">
      <div className="text-center text-sm ">
        © {new Date().getFullYear()} Creative Portfolio. All rights reserved.
      </div>
    </footer>
  );
}
