"use client"

import type React from "react"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import { motion } from "framer-motion"
import AnimatedSection from "../ui/animated-section"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Define contact type
interface ContactItem {
  id: number
  type: "email" | "phone" | "facebook" | "linkedin" | "instagram" | "twitter" | "other"
  value: string
  label?: string
}

export default function ContactSection() {
  // State for contact items
  const [contactItems, setContactItems] = useState<ContactItem[]>([
    { id: 1, type: "email", value: "hello@myportfolio.com" },
    { id: 2, type: "phone", value: "+123-456-7890" },
    { id: 3, type: "linkedin", value: "linkedin.com/in/myportfolio" },
  ])

  // State for add/edit contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [currentContact, setCurrentContact] = useState<ContactItem | null>(null)
  const [contactType, setContactType] = useState<ContactItem["type"]>("email")
  const [contactValue, setContactValue] = useState("")
  const [contactLabel, setContactLabel] = useState("")

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<number | null>(null)

  // State for contact form dialog
  const [contactFormOpen, setContactFormOpen] = useState(false)
  const [contactFormEmail, setContactFormEmail] = useState("")
  const [contactFormSubject, setContactFormSubject] = useState("")
  const [contactFormMessage, setContactFormMessage] = useState("")
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false)
  const [contactFormSuccess, setContactFormSuccess] = useState(false)

  // Function to open add contact dialog
  const openAddContactDialog = () => {
    setCurrentContact(null)
    setContactType("email")
    setContactValue("")
    setContactLabel("")
    setContactDialogOpen(true)
  }

  // Function to open edit contact dialog
  const openEditContactDialog = (contact: ContactItem) => {
    setCurrentContact(contact)
    setContactType(contact.type)
    setContactValue(contact.value)
    setContactLabel(contact.label || "")
    setContactDialogOpen(true)
  }

  // Function to save contact
  const saveContact = () => {
    if (currentContact) {
      // Edit existing contact
      setContactItems(
        contactItems.map((item) =>
          item.id === currentContact.id
            ? { ...item, type: contactType, value: contactValue, label: contactLabel || undefined }
            : item,
        ),
      )
    } else {
      // Add new contact
      const newContactId = contactItems.length > 0 ? Math.max(...contactItems.map((item) => item.id)) + 1 : 1
      const newContact: ContactItem = {
        id: newContactId,
        type: contactType,
        value: contactValue,
        label: contactLabel || undefined,
      }
      setContactItems([...contactItems, newContact])
    }
    setContactDialogOpen(false)
  }

  // Function to open delete confirmation dialog
  const confirmDeleteContact = (contactId: number) => {
    setContactToDelete(contactId)
    setDeleteDialogOpen(true)
  }

  // Function to delete a contact
  const deleteContact = () => {
    if (contactToDelete !== null) {
      setContactItems(contactItems.filter((item) => item.id !== contactToDelete))
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  // Function to handle contact form submission
  const handleContactFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactFormSubmitting(true)

    // Simulate form submission
    setTimeout(() => {
      setContactFormSubmitting(false)
      setContactFormSuccess(true)

      // Reset form after success
      setTimeout(() => {
        setContactFormOpen(false)
        setContactFormEmail("")
        setContactFormSubject("")
        setContactFormMessage("")
        setContactFormSuccess(false)
      }, 2000)
    }, 1500)
  }

  // Function to get icon for contact type
  const getContactIcon = (type: ContactItem["type"]) => {
    switch (type) {
      case "email":
        return <Mail className="h-5 w-5" />
      case "phone":
        return <Phone className="h-5 w-5" />
      case "facebook":
        return <Facebook className="h-5 w-5" />
      case "linkedin":
        return <Linkedin className="h-5 w-5" />
      case "instagram":
        return <Instagram className="h-5 w-5" />
      case "twitter":
        return <Twitter className="h-5 w-5" />
      default:
        return <Mail className="h-5 w-5" />
    }
  }

  return (
    <div className="py-16 md:py-20 lg:py-24 bg-red-600 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Title Column */}
          <div className="md:col-span-5 lg:col-span-4">
            <AnimatedSection delay={0.1}>
              <h2 className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none">
                LET'S WORK TOGETHER
              </h2>
              <div className="flex mt-4 ml-1">
                <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </AnimatedSection>
          </div>

          {/* Content Column */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedSection delay={0.3} direction="left">
                <div className="bg-red-700/30 backdrop-blur-sm rounded-lg p-6 shadow-md">
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique."
                    className="text-sm mb-4"
                  />
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique."
                    className="text-sm"
                  />
                </div>
              </AnimatedSection>
              <AnimatedSection delay={0.5} direction="left">
                <div className="bg-red-700/30 backdrop-blur-sm rounded-lg p-6 shadow-md">
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md mb-4"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditableImage
                      src="https://picsum.photos/400/300?random=footer"
                      alt="Contact image"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
                  </motion.div>

                  {/* Contact Information */}
                  <div className="space-y-3 mb-6">
                    {contactItems.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between group">
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 mr-2">
                            {getContactIcon(contact.type)}
                          </span>
                          <span>{contact.value}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/70 hover:text-white hover:bg-red-700/50"
                            onClick={() => openEditContactDialog(contact)}
                          >
                            <PlusCircle size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/70 hover:text-white hover:bg-red-700/50"
                            onClick={() => confirmDeleteContact(contact.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Contact Button */}
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white text-white hover:bg-white/10"
                      onClick={openAddContactDialog}
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Add Contact
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white text-white hover:bg-white/10"
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
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
            <DialogDescription>
              {currentContact ? "Update your contact information" : "Add a new contact method to your portfolio"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactType" className="text-right">
                Type
              </Label>
              <select
                id="contactType"
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={contactType}
                onChange={(e) => setContactType(e.target.value as ContactItem["type"])}
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
              <Label htmlFor="contactValue" className="text-right">
                Value
              </Label>
              <Input
                id="contactValue"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactLabel" className="text-right">
                Label (Optional)
              </Label>
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
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
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
              Are you sure you want to delete this contact information? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={deleteContact}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
              Fill out the form below to send me a message. I'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContactFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Your Email
                </Label>
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
                <Label htmlFor="subject" className="text-right">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={contactFormSubject}
                  onChange={(e) => setContactFormSubject(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
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
              <Button variant="outline" onClick={() => setContactFormOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={contactFormSubmitting}>
                {contactFormSubmitting ? "Sending..." : contactFormSuccess ? "Sent!" : "Send Message"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
