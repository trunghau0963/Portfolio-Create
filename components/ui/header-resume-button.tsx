"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function HeaderResumeButton() {
  const [resumeFile, setResumeFile] = useState<{ url: string; name: string } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Get resume info from localStorage
  useEffect(() => {
    const storedResume = localStorage.getItem("portfolio-resume")
    if (storedResume) {
      const parsed = JSON.parse(storedResume)
      setResumeFile({
        url: parsed.url,
        name: parsed.name,
      })
    } else {
      // Default resume
      setResumeFile({
        url: "/resume.pdf",
        name: "Your_Name_Resume.pdf",
      })
    }
  }, [])

  const handleDownload = () => {
    if (!resumeFile) return

    setIsDownloading(true)

    // Simulate download process
    setTimeout(() => {
      try {
        // Create an anchor element and trigger download
        const link = document.createElement("a")
        link.href = resumeFile.url
        link.download = resumeFile.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setIsDownloading(false)
      } catch (error) {
        console.error("Download failed:", error)
        setIsDownloading(false)
      }
    }, 500)
  }

  if (!resumeFile) return null

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="sm" className="h-8 px-3 py-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={isDownloading ? "downloading" : "idle"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {isDownloading ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span>{isDownloading ? "..." : "Resume"}</span>
        </motion.div>
      </AnimatePresence>
    </Button>
  )
}
