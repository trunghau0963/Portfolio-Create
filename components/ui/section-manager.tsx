"use client"

import { useState } from "react"
import { useSections, type SectionType } from "@/context/section-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUp, ArrowDown, Eye, EyeOff, Plus, Trash2, Settings } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export default function SectionManager() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  const {
    sections,
    toggleSectionVisibility,
    reorderSection,
    addSection,
    deleteSection,
    updateSectionTitle,
    updateSectionBgColor,
  } = useSections()

  const [isOpen, setIsOpen] = useState(false)
  const [newSectionType, setNewSectionType] = useState<SectionType>("custom")
  const [newSectionTitle, setNewSectionTitle] = useState("")
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null)
  const [editingSectionTitle, setEditingSectionTitle] = useState("")
  const [editingSectionColor, setEditingSectionColor] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null)

  if (!isAdmin) return null

  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      addSection(newSectionType, newSectionTitle)
      setNewSectionType("custom")
      setNewSectionTitle("")
    }
  }

  const handleMoveUp = (id: number) => {
    const section = sections.find((s) => s.id === id)
    if (section && section.position > 1) {
      reorderSection(id, section.position - 1)
    }
  }

  const handleMoveDown = (id: number) => {
    const section = sections.find((s) => s.id === id)
    if (section && section.position < sections.length) {
      reorderSection(id, section.position + 1)
    }
  }

  const handleEditSection = (id: number) => {
    const section = sections.find((s) => s.id === id)
    if (section) {
      setEditingSectionId(id)
      setEditingSectionTitle(section.title)
      setEditingSectionColor(section.bgColor || "")
    }
  }

  const handleSaveEdit = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      updateSectionTitle(editingSectionId, editingSectionTitle)
      if (editingSectionColor) {
        updateSectionBgColor(editingSectionId, editingSectionColor)
      }
      setEditingSectionId(null)
    }
  }

  const confirmDelete = (id: number) => {
    setSectionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = () => {
    if (sectionToDelete) {
      deleteSection(sectionToDelete)
      setDeleteDialogOpen(false)
      setSectionToDelete(null)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-16 right-4 z-40 bg-white dark:bg-gray-800 shadow-md"
      >
        <Settings className="h-4 w-4 mr-2" />
        Manage Sections
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Portfolio Sections</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Section List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Sections</h3>
              <div className="border rounded-md">
                {sections
                  .sort((a, b) => a.position - b.position)
                  .map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      {editingSectionId === section.id ? (
                        <div className="flex-1 space-y-2">
                          <Input
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            placeholder="Section title"
                          />
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`section-color-${section.id}`} className="text-xs">
                              Background:
                            </Label>
                            <Input
                              id={`section-color-${section.id}`}
                              type="color"
                              value={editingSectionColor}
                              onChange={(e) => setEditingSectionColor(e.target.value)}
                              className="w-16 h-8 p-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingSectionId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: section.bgColor || "transparent" }}
                            />
                            <span className="font-medium">{section.title}</span>
                            <span className="text-xs text-gray-500">({section.type})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSectionVisibility(section.id)}
                              title={section.visible ? "Hide section" : "Show section"}
                            >
                              {section.visible ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveUp(section.id)}
                              disabled={section.position === 1}
                              title="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveDown(section.id)}
                              disabled={section.position === sections.length}
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSection(section.id)}
                              title="Edit section"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(section.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete section"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Add New Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Add New Section</h3>
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Select value={newSectionType} onValueChange={(value) => setNewSectionType(value as SectionType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom</SelectItem>
                        <SelectItem value="hero">Hero</SelectItem>
                        <SelectItem value="introduction">Introduction</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="skills">Skills</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Section title"
                    />
                  </div>
                </div>
                <Button onClick={handleAddSection} disabled={!newSectionTitle.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this section? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
