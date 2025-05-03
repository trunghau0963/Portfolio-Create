"use client"

import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import AnimatedSection from "../ui/animated-section"
import ResumeManager from "../ui/resume-manager"

export default function IntroductionSection() {
  return (
    <section id="introduction" className="py-16 md:py-20 lg:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row */}
        <div className="mb-12">
          <AnimatedSection variant="fadeInLeft" delay={0.1}>
            <h2 className="text-red-600 font-bold tracking-tighter leading-none mb-6">
              <EditableText initialText="INTRODUCTION" as="span" initialFontSize={120} />
            </h2>
            <div className="flex mt-4">
              <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
            </div>
          </AnimatedSection>
        </div>

        {/* Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* First Column - Takes full width on mobile, 6 columns on large screens */}
          <div className="lg:col-span-6">
            <AnimatedSection variant="fadeInUp" delay={0.3}>
              <div className="space-y-6">
                <EditableText
                  initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi."
                  initialFontSize={14}
                />
                <EditableText
                  initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel."
                  initialFontSize={14}
                />
              </div>
            </AnimatedSection>
          </div>

          {/* Second Column - Takes full width on mobile, 6 columns on large screens */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatedSection variant="fadeInUp" delay={0.5}>
                <div className="space-y-6">
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur."
                    initialFontSize={14}
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection variant="zoomIn" delay={0.7}>
                <div className="mt-4">
                  <EditableImage
                    src="https://picsum.photos/400/300?random=intro"
                    alt="Introduction image"
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover rounded-md shadow-md hover:shadow-lg transition-shadow duration-300"
                  />
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>

        {/* Resume Manager Section */}
        <AnimatedSection variant="fadeInUp" delay={0.7} className="mt-12">
          <ResumeManager />
        </AnimatedSection>
      </div>
    </section>
  )
}
