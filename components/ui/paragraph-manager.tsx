"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"

// Define paragraph types
export type ParagraphType = "heading" | "subheading" | "body" | "quote" | "list-item"

export interface ParagraphOld {
  id: number
  type: ParagraphType
  content: string
  position: number
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: "left" | "center" | "right" | "justify"
}

interface ParagraphManagerProps {
  sectionId: string
  className?: string
}

export function ParagraphManager({ sectionId, className = "" }: ParagraphManagerProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [paragraphs, setParagraphs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch paragraphs on mount
  useEffect(() => {
    async function fetchParagraphs() {
      try {
        setIsLoading(true)
        setError(null)
        // Simulate fetching paragraphs
        setTimeout(() => {
          setParagraphs([
            { id: 1, type: "body", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
            { id: 2, type: "heading", content: "Section Heading" },
          ])
          setIsLoading(false)
        }, 500)
      } catch (err) {
        console.error("Error fetching paragraphs:", err)
        setError("Failed to load paragraphs")
        setIsLoading(false)
      }
    }

    fetchParagraphs()
  }, [sectionId])

  const addParagraph = () => {
    // Simulate adding a paragraph
    setParagraphs((prev) => [...prev, { id: prev.length + 1, type: "body", content: "New paragraph" }])
  }

  const updateParagraph = (index: number, updatedParagraph: any) => {
    // Simulate updating a paragraph
    setParagraphs((prev) => prev.map((p, i) => (i === index ? { ...p, ...updatedParagraph } : p)))
  }

  const deleteParagraph = (index: number) => {
    // Simulate deleting a paragraph
    setParagraphs((prev) => prev.filter((_, i) => i !== index))
  }

  const moveParagraph = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === paragraphs.length - 1)) {
      return
    }

    const newIndex = direction === "up" ? index - 1 : index + 1
    const newParagraphs = [...paragraphs]
    const temp = newParagraphs[index]
    newParagraphs[index] = newParagraphs[newIndex]
    newParagraphs[newIndex] = temp

    setParagraphs(newParagraphs)
  }

  const renderParagraphContent = (paragraph: any) => {
    const { type, content } = paragraph

    switch (type) {
      case "heading":
        return <h2 className="text-2xl font-bold mb-4">{content}</h2>
      case "subheading":
        return <h3 className="text-xl font-semibold mb-3">{content}</h3>
      case "quote":
        return <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">{content}</blockquote>
      case "list-item":
        return <li className="ml-5 list-disc">{content}</li>
      default:
        return <p className="mb-4">{content}</p>
    }
  }

  return (
    <div className={className}>
      {/* Display paragraphs */}
      <div className="mb-8">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="mb-6">
            {renderParagraphContent(paragraph)}

            {user?.isAdmin && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => moveParagraph(index, "up")} disabled={index === 0}>
                  <ArrowUp className="h-4 w-4 mr-1" /> Move Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveParagraph(index, "down")}
                  disabled={index === paragraphs.length - 1}
                >
                  <ArrowDown className="h-4 w-4 mr-1" /> Move Down
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteParagraph(index)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>

                <div className="w-full mt-2">
                  <Textarea
                    value={paragraph.content}
                    onChange={(e) => updateParagraph(index, { content: e.target.value })}
                    className="mb-2"
                  />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <Label htmlFor={`type-${index}`}>Type</Label>
                      <Select value={paragraph.type} onValueChange={(value) => updateParagraph(index, { type: value })}>
                        <SelectTrigger id={`type-${index}`}>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="body">Body</SelectItem>
                          <SelectItem value="heading">Heading</SelectItem>
                          <SelectItem value="subheading">Subheading</SelectItem>
                          <SelectItem value="quote">Quote</SelectItem>
                          <SelectItem value="list-item">List Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`font-size-${index}`}>Font Size</Label>
                      <Select value={"normal"} onValueChange={(value) => updateParagraph(index, {})}>
                        <SelectTrigger id={`font-size-${index}`}>
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`font-weight-${index}`}>Font Weight</Label>
                      <Select value={"normal"} onValueChange={(value) => updateParagraph(index, {})}>
                        <SelectTrigger id={`font-weight-${index}`}>
                          <SelectValue placeholder="Weight" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`text-align-${index}`}>Alignment</Label>
                      <Select value={"left"} onValueChange={(value) => updateParagraph(index, {})}>
                        <SelectTrigger id={`text-align-${index}`}>
                          <SelectValue placeholder="Align" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="justify">Justify</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {paragraphs.length === 0 && (
          <p className="text-gray-500 text-center py-4">No content yet. Add some paragraphs to get started.</p>
        )}
      </div>

      {/* Add paragraph button (admin only) */}
      {user?.isAdmin && (
        <Button onClick={addParagraph} className="mb-4">
          <Plus className="h-4 w-4 mr-2" /> Add Paragraph
        </Button>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  )
}

export default ParagraphManager
