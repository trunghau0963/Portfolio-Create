"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Download, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DownloadButtonProps extends ButtonProps {
  fileUrl: string
  fileName: string
  text?: string
  iconPosition?: "left" | "right"
}

export default function DownloadButton({
  fileUrl,
  fileName,
  text = "Download Resume",
  iconPosition = "left",
  className,
  ...props
}: DownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "success" | "error">("idle")

  const handleDownload = () => {
    setDownloadState("downloading")

    // Simulate download process
    setTimeout(() => {
      try {
        // Create an anchor element and trigger download
        const link = document.createElement("a")
        link.href = fileUrl
        link.download = fileName
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

  const getIcon = () => {
    switch (downloadState) {
      case "downloading":
        return (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return downloadState === "idle" && iconPosition === "left" ? (
          <Download className="h-4 w-4" />
        ) : downloadState === "idle" && iconPosition === "right" ? (
          <FileText className="h-4 w-4" />
        ) : null
    }
  }

  const getText = () => {
    switch (downloadState) {
      case "downloading":
        return "Downloading..."
      case "success":
        return "Downloaded!"
      case "error":
        return "Try Again"
      default:
        return text
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={downloadState === "downloading"}
      className={`relative overflow-hidden group ${className}`}
      {...props}
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
          {iconPosition === "left" && getIcon()}
          <span>{getText()}</span>
          {iconPosition === "right" && getIcon()}
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
  )
}
