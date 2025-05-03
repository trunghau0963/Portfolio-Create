"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Upload, FileText, CheckCircle, AlertCircle, Trash2, Calendar, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import AnimatedSection from "./animated-section"

interface ResumeFile {
  url: string
  name: string
  size: number
  lastModified: Date
}

export default function ResumeManager({ className = "" }: { className?: string }) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resumeFile, setResumeFile] = useState<ResumeFile | null>(null)
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "success" | "error">("idle")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Initialize with a default resume (in a real app, this would come from your backend)
  useEffect(() => {
    const storedResume = localStorage.getItem("portfolio-resume")
    if (storedResume) {
      setResumeFile(JSON.parse(storedResume))
    } else {
      // Default resume
      setResumeFile({
        url: "/resume.pdf",
        name: "Your_Name_Resume.pdf",
        size: 1024 * 1024 * 2.5, // 2.5MB
        lastModified: new Date(2023, 4, 15),
      })
    }
  }, [])

  // Save resume to localStorage when it changes
  useEffect(() => {
    if (resumeFile) {
      localStorage.setItem("portfolio-resume", JSON.stringify(resumeFile))
    }
  }, [resumeFile])

  const handleDownload = () => {
    if (!resumeFile) return

    setDownloadState("downloading")

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

        setDownloadState("success")
        setTimeout(() => setDownloadState("idle"), 2000)
      } catch (error) {
        console.error("Download failed:", error)
        setDownloadState("error")
        setTimeout(() => setDownloadState("idle"), 2000)
      }
    }, 800) // Simulate network delay
  }

  const openUploadDialog = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadState("idle")
    setUploadDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return

    setUploadState("uploading")

    // Simulate upload process
    setTimeout(() => {
      try {
        // In a real app, you would upload the file to your server/storage here
        // For now, we'll create a local URL and store file metadata
        const newResumeFile: ResumeFile = {
          url: URL.createObjectURL(selectedFile),
          name: selectedFile.name,
          size: selectedFile.size,
          lastModified: new Date(),
        }

        setResumeFile(newResumeFile)
        setUploadState("success")

        // Close dialog after success
        setTimeout(() => {
          setUploadDialogOpen(false)
          setUploadState("idle")
        }, 1500)
      } catch (error) {
        console.error("Upload failed:", error)
        setUploadState("error")
        setTimeout(() => setUploadState("idle"), 2000)
      }
    }, 1500) // Simulate network delay
  }

  const handleDelete = () => {
    // In a real app, you would delete the file from your server/storage here
    setResumeFile(null)
    setDeleteDialogOpen(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <AnimatedSection
      variant="fadeInUp"
      className={`bg-red-600 text-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Resume</h3>
              <p className="text-sm text-white/80">
                {isAdmin ? "Manage and download your resume" : "Download my complete resume"}
              </p>
            </div>
          </div>

          {/* Download Button (for both admin and guests) */}
          <Button
            onClick={handleDownload}
            disabled={downloadState !== "idle" || !resumeFile}
            variant="outline"
            className="border-white text-white hover:bg-white/20 min-w-[160px] justify-center relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={downloadState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                {downloadState === "idle" && <Download className="h-4 w-4" />}
                {downloadState === "downloading" && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {downloadState === "success" && <CheckCircle className="h-4 w-4" />}
                {downloadState === "error" && <AlertCircle className="h-4 w-4" />}
                <span>
                  {downloadState === "idle" && "Download Resume"}
                  {downloadState === "downloading" && "Downloading..."}
                  {downloadState === "success" && "Downloaded!"}
                  {downloadState === "error" && "Try Again"}
                </span>
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: 0 }}
              animate={{
                width: downloadState === "downloading" ? "100%" : 0,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </Button>
        </div>

        {/* File Information and Admin Controls */}
        {resumeFile && (
          <div className="mt-2 bg-white/10 rounded-md p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-sm font-medium">{resumeFile.name}</p>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(resumeFile.lastModified)}
                  </span>
                  <span>{formatFileSize(resumeFile.size)}</span>
                </div>
              </div>
            </div>

            {/* Admin-only controls */}
            {isAdmin && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 flex-1 sm:flex-auto"
                  onClick={openUploadDialog}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-red-700 flex-1 sm:flex-auto"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Admin-only upload button when no resume exists */}
        {isAdmin && !resumeFile && (
          <div className="mt-2 bg-white/10 rounded-md p-6 flex flex-col items-center justify-center">
            <p className="text-sm text-white/80 mb-3">No resume uploaded yet</p>
            <Button variant="outline" className="border-white text-white hover:bg-white/20" onClick={openUploadDialog}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        )}
      </div>

      {/* Upload Dialog (Admin Only) */}
      <Dialog open={uploadDialogOpen && isAdmin} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Upload a PDF file of your resume. This will replace your current resume if one exists.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              {previewUrl ? (
                <div className="flex items-center justify-center bg-gray-100 rounded p-4 w-full">
                  <FileText className="h-10 w-10 text-gray-400 mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{selectedFile?.name}</p>
                    <p className="text-xs text-gray-500">{selectedFile && formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to select a file or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOC, or DOCX (Max 10MB)</p>
                </>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Change File
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploadState === "uploading"}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploadState === "uploading"}>
              {uploadState === "idle" && "Upload"}
              {uploadState === "uploading" && (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Uploading...
                </>
              )}
              {uploadState === "success" && (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uploaded!
                </>
              )}
              {uploadState === "error" && (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Admin Only) */}
      <Dialog open={deleteDialogOpen && isAdmin} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedSection>
  )
}
