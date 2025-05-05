"use client"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, ImageIcon, Type, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import AnimatedSection from "../ui/animated-section"
import { useAuth } from "@/context/auth-context"

// Define content block types
type ContentBlockType = "title" | "text" | "image"

interface ContentBlock {
  id: number
  type: ContentBlockType
  content: string
  fontSize?: number
}

interface CustomSectionProps {
  id: number
  title: string
  bgColor?: string
}

export default function CustomSection({ id, title, bgColor = "#f3f4f6" }: CustomSectionProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // State for content blocks
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: 1, type: "title", content: title, fontSize: 72 },
  ])

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [blockToDelete, setBlockToDelete] = useState<number | null>(null)

  // State for add content dialog
  const [addContentDialogOpen, setAddContentDialogOpen] = useState(false)

  // Function to add a new content block
  const addContentBlock = (type: ContentBlockType) => {
    const newBlockId = Math.max(...contentBlocks.map((block) => block.id), 0) + 1

    let newContent = ""
    let newFontSize: number | undefined = undefined

    switch (type) {
      case "title":
        newContent = "New Title"
        newFontSize = 36
        break
      case "text":
        newContent = "Add your text here. Click the pencil icon to edit this text."
        newFontSize = 16
        break
      case "image":
        newContent = `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`
        break
    }

    const newBlock: ContentBlock = {
      id: newBlockId,
      type,
      content: newContent,
      fontSize: newFontSize,
    }

    setContentBlocks([...contentBlocks, newBlock])
    setAddContentDialogOpen(false)
  }

  // Function to delete a content block
  const deleteContentBlock = (id: number) => {
    setContentBlocks(contentBlocks.filter((block) => block.id !== id))
    setDeleteDialogOpen(false)
    setBlockToDelete(null)
  }

  // Function to confirm delete
  const confirmDelete = (id: number) => {
    setBlockToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Function to update content
  const updateContent = (id: number, newContent: string, newFontSize?: number) => {
    setContentBlocks(
      contentBlocks.map((block) =>
        block.id === id ? { ...block, content: newContent, fontSize: newFontSize || block.fontSize } : block,
      ),
    )
  }

  // Render content block based on type
  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "title":
        return (
          <AnimatedSection key={block.id} delay={0.1 * index} variant="fadeInUp">
            <div className="mb-6">
              <EditableText
                initialText={block.content}
                as="h2"
                className="font-bold tracking-tighter leading-none"
                initialFontSize={block.fontSize || 36}
              />
              {isAdmin && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => confirmDelete(block.id)}
                  >
                    <Trash2 size={16} />
                    <span className="ml-1">Delete</span>
                  </Button>
                </div>
              )}
            </div>
          </AnimatedSection>
        )

      case "text":
        return (
          <AnimatedSection key={block.id} delay={0.1 * index} variant="fadeInUp">
            <div className="mb-6">
              <EditableText initialText={block.content} className="mb-4" initialFontSize={block.fontSize || 16} />
              {isAdmin && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => confirmDelete(block.id)}
                  >
                    <Trash2 size={16} />
                    <span className="ml-1">Delete</span>
                  </Button>
                </div>
              )}
            </div>
          </AnimatedSection>
        )

      case "image":
        return (
          <AnimatedSection key={block.id} delay={0.1 * index} variant="fadeInUp">
            <div className="mb-6">
              <div className="rounded-lg overflow-hidden">
                <EditableImage
                  src={block.content}
                  alt="Custom section image"
                  width={800}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
              {isAdmin && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    onClick={() => confirmDelete(block.id)}
                  >
                    <Trash2 size={16} />
                    <span className="ml-1">Delete</span>
                  </Button>
                </div>
              )}
            </div>
          </AnimatedSection>
        )

      default:
        return null
    }
  }

  return (
    <section id={`custom-${id}`} className="py-16 md:py-20 lg:py-24" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Content Blocks */}
        <div className="space-y-4">{contentBlocks.map((block, index) => renderContentBlock(block, index))}</div>

        {/* Add Content Button - Only visible to admin */}
        {isAdmin && (
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <Button
              onClick={() => setAddContentDialogOpen(true)}
              variant="outline"
              className="border-gray-400 text-gray-600 hover:bg-gray-100 flex items-center gap-2"
            >
              <PlusCircle size={16} />
              Add Content
            </Button>
          </motion.div>
        )}
      </div>

      {/* Add Content Dialog */}
      <Dialog open={addContentDialogOpen} onOpenChange={setAddContentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Content</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => addContentBlock("title")}
              >
                <Type size={24} className="mb-2" />
                <span>Title</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => addContentBlock("text")}
              >
                <FileText size={24} className="mb-2" />
                <span>Text</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 p-4"
                onClick={() => addContentBlock("image")}
              >
                <ImageIcon size={24} className="mb-2" />
                <span>Image</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContentDialogOpen(false)}>
              Cancel
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
          </DialogHeader>
          <p>Are you sure you want to delete this content block? This action cannot be undone.</p>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={() => blockToDelete && deleteContentBlock(blockToDelete)}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
