"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import EditableText from "../ui/editable-text"
import EditablePortrait from "../ui/editable-portrait"
import AnimatedSection from "../ui/animated-section"
import { Button } from "@/components/ui/button"
import { Download, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"

export default function HeroSection() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [portraitPosition, setPortraitPosition] = useState<"left" | "center" | "right">("center")
  const [resumeFile, setResumeFile] = useState<{ url: string; name: string } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showPortrait, setShowPortrait] = useState(true)

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

    // Get portrait visibility from localStorage
    const storedPortraitVisibility = localStorage.getItem("portfolio-portrait-visibility")
    if (storedPortraitVisibility !== null) {
      setShowPortrait(storedPortraitVisibility === "true")
    }
  }, [])

  // Save portrait visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("portfolio-portrait-visibility", showPortrait.toString())
  }, [showPortrait])

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
    }, 800)
  }

  return (
    <section className="relative bg-gray-100 text-gray-900 pt-24 pb-12 md:pt-32 md:pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row */}
        <div className="mb-16">
          <AnimatedSection variant="fadeInDown" duration={0.8}>
            <div className="relative z-10">
              <EditableText
                initialText="PORTFOLIO"
                as="h1"
                className="text-red-600 font-bold leading-none tracking-tighter"
                initialFontSize={120}
              />
            </div>
          </AnimatedSection>
        </div>

        {/* Content Row */}
        <div className="relative">
          {/* Portrait Image - Only shown if showPortrait is true */}
          {showPortrait && (
            <div
              className={`absolute z-20 top-1/2 transform -translate-y-1/2 ${
                portraitPosition === "left"
                  ? "left-1/4 -translate-x-1/2"
                  : portraitPosition === "right"
                    ? "right-1/4 translate-x-1/2"
                    : "left-1/2 -translate-x-1/2"
              }`}
            >
              <AnimatedSection variant="zoomIn" delay={0.3} duration={0.8}>
                <EditablePortrait
                  initialSrc="/placeholder.svg?height=500&width=350"
                  alt="Portrait"
                  width={350}
                  height={500}
                  onPositionChange={setPortraitPosition}
                  currentPosition={portraitPosition}
                />
              </AnimatedSection>
            </div>
          )}

          {/* Text Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <AnimatedSection variant="fadeInLeft" delay={0.5} duration={0.8}>
              <div className="min-h-[100px]">
                <EditableText
                  initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi. Proin ut dictum justo. Curabitur ut gravida libero."
                  className="max-w-md"
                  initialFontSize={14}
                />
              </div>
            </AnimatedSection>
            <AnimatedSection variant="fadeInRight" delay={0.7} duration={0.8}>
              <div className="flex items-start justify-end min-h-[100px]">
                <EditableText
                  initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi. Proin ut dictum justo. Curabitur ut gravida libero."
                  className="max-w-md"
                  initialFontSize={14}
                />
                <motion.div
                  className="ml-4 mt-1"
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-600"
                  >
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Controls Row */}
        <div className="mt-12 flex flex-wrap items-center gap-6">
          {/* Download Resume Button */}
          {resumeFile && (
            <AnimatedSection variant="fadeIn" delay={0.9} duration={0.8}>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {isDownloading ? (
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
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isDownloading ? "Downloading..." : "Download Resume"}</span>
              </Button>
            </AnimatedSection>
          )}

          {/* Portrait Toggle Switch - Only visible for admin */}
          {isAdmin && (
            <AnimatedSection variant="fadeIn" delay={1} duration={0.8}>
              <div className="flex items-center space-x-2">
                <Switch id="portrait-toggle" checked={showPortrait} onCheckedChange={setShowPortrait} />
                <Label htmlFor="portrait-toggle" className="flex items-center gap-2">
                  {showPortrait ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Hide Portrait</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Show Portrait</span>
                    </>
                  )}
                </Label>
              </div>
            </AnimatedSection>
          )}
        </div>

        {/* Dots */}
        <AnimatedSection variant="fadeIn" delay={1.1} duration={0.8}>
          <div className="flex mt-8 ml-1">
            <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
            <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
