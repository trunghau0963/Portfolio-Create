"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import EditableText from "../ui/editable-text"
import EditablePortrait from "../ui/editable-potrait"

export default function HeroSection() {
  const [portraitPosition, setPortraitPosition] = useState<"left" | "center" | "right">("center")

  return (
    <section className="relative bg-gray-100 text-gray-900 pt-24 pb-12 md:pt-32 md:pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative">
        {/* Large Portfolio Text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <EditableText
            initialText="PORTFOLIO"
            as="h1"
            className="text-red-600 text-7xl sm:text-8xl md:text-9xl lg:text-[180px] font-bold leading-none tracking-tighter"
          />
        </motion.div>

        {/* Portrait Image */}
        {/* <div
          className={`absolute z-20 top-1/2 transform -translate-y-1/2 ${
            portraitPosition === "left"
              ? "left-1/4 -translate-x-1/2"
              : portraitPosition === "right"
                ? "right-1/4 translate-x-1/2"
                : "left-1/2 -translate-x-1/2"
          }`}
        >
          <EditablePortrait
            initialSrc="/placeholder.svg?height=500&width=350"
            alt="Portrait"
            width={350}
            height={500}
            onPositionChange={setPortraitPosition}
            currentPosition={portraitPosition}
          />
        </div> */}

        {/* Text Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <EditableText
              initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi. Proin ut dictum justo. Curabitur ut gravida libero."
              className="text-sm max-w-md"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex items-start justify-end"
          >
            <EditableText
              initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi. Proin ut dictum justo. Curabitur ut gravida libero."
              className="text-sm max-w-md"
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
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex mt-8 ml-1">
          <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
          <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
          <div className="w-2 h-2 rounded-full bg-red-600"></div>
        </div>
      </div>
    </section>
  )
}
