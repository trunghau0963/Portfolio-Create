"use client"

import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import AnimatedSection from "../ui/animated-section"

export default function IntroductionSection() {
  return (
    <section id="introduction" className="py-16 md:py-20 lg:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Title Column - Takes full width on mobile, 4 columns on large screens */}
          <div className="lg:col-span-4">
            <AnimatedSection delay={0.1}>
              <h2 className="text-red-600 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-6">
                INTRO&shy;DUCTION
              </h2>
              <div className="flex mt-4">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
            </AnimatedSection>
          </div>

          {/* Content Column - Takes full width on mobile, 8 columns on large screens */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Column */}
              <AnimatedSection delay={0.3} direction="left">
                <div className="space-y-6">
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi."
                    className="text-sm"
                  />
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel."
                    className="text-sm"
                  />
                </div>
              </AnimatedSection>

              {/* Second Column */}
              <AnimatedSection delay={0.5} direction="left">
                <div className="space-y-6">
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur."
                    className="text-sm"
                  />
                  <div className="mt-4">
                    <EditableImage
                      src="https://picsum.photos/400/300?random=intro"
                      alt="Introduction image"
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover rounded-md shadow-md hover:shadow-lg transition-shadow duration-300"
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
