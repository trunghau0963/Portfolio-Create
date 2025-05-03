"use client"
import DownloadButton from "./download-button"
import { FileText } from "lucide-react"
import AnimatedSection from "./animated-section"

interface ResumeDownloadProps {
  className?: string
}

export default function ResumeDownload({ className = "" }: ResumeDownloadProps) {
  // In a real implementation, this would be a path to your actual resume PDF
  const resumeUrl = "/resume.pdf"
  const fileName = "Your_Name_Resume.pdf"

  return (
    <AnimatedSection
      variant="fadeInUp"
      className={`bg-red-600 text-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Resume</h3>
            <p className="text-sm text-white/80">Download my complete resume</p>
          </div>
        </div>
        <DownloadButton
          fileUrl={resumeUrl}
          fileName={fileName}
          variant="outline"
          className="border-white text-white hover:bg-white/20 min-w-[160px] justify-center"
        />
      </div>
    </AnimatedSection>
  )
}
