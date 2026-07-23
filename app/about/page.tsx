"use client"

import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ScrollIndicators from "@/components/scroll-indicators"
import { CornerRightDown, CornerDownRight } from "lucide-react"
import InstagramSection from "@/components/instagram-section"

export default function About() {
  // Reusable component for full-width separator lines
  const SeparatorLine = () => (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-px bg-neutral-600 mb-16"></div>
  )

  // Reusable component for section headers
  const SectionHeader = ({ title, subtitle }) => (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-2">
        <p className="text-lg font-bold">{title}</p>
        <CornerRightDown className="w-5 h-5" />
      </div>
      {subtitle && (
        <div className="text-center mb-24">
          <h2 className="text-6xl md:text-8xl font-light leading-none">{subtitle}</h2>
        </div>
      )}
    </div>
  )

  // Reusable component for main content text
  const MainContentText = ({ children, className = "" }) => (
    <p className={`text-4xl md:text-6xl font-light leading-none ${className}`}>{children}</p>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden">
      <ScrollIndicators />
      <Header />

      <main className="flex-1">
        {/* Background Image Container - covers all sections until Instagram */}
        <div className="relative">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/detailed.jpg"
              alt="Tattoo artist at work"
              fill
              className="object-cover opacity-30 blur-lg"
              priority
            />
          </div>

          {/* Main Content Section */}
          <section className="relative z-10 min-h-screen text-white px-12 pb-16 pt-32 flex flex-col justify-center">
            <div className="w-full">
              <div className="mb-32">
                <div className="mb-16">
                  <p className="text-xl font-bold leading-none mb-16">
                    Exploring art
                    <br />
                    through tattooing.
                  </p>

                  <SeparatorLine />

                  <div className="w-full mb-24">
                    <MainContentText className="mb-16">
                      <span className="ml-24">For over 11 years,</span> I've been creating powerful realistic and dark fantasy tattoos that
                      tell deeply personal stories. My approach combines high-contrast realism with symbolic storytelling
                      and meticulous attention to emotional detail.
                    </MainContentText>
                  </div>

                  <SeparatorLine />

                  <div className="w-full mb-24">
                    <MainContentText>
                      <span className="ml-24">I specialize in</span> realistic, dark fantasy, Chicano, and portrait styles characterized by dramatic contrasts,
                      intricate shading, and profound symbolic meaning. Every piece is a custom narrative crafted through
                      careful collaboration and personal connection.
                    </MainContentText>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Education & Experience Section */}
          <section className="relative z-10 min-h-screen text-white px-12 py-16">
            <div className="w-full h-full flex flex-col justify-center">
              <SectionHeader
                title="Education & Experience"
                subtitle={
                  <>
                    Continuous
                    <br />
                    improvement
                  </>
                }
              />

              <div className="flex justify-between items-center mb-16">
                <p className="text-xl font-bold leading-none mb-16">
                  Refining skills through
                  <br />
                  masterclasses and seminars.
                </p>
              </div>

              <SeparatorLine />

              <div className="w-full mb-24">
                <MainContentText className="mb-16">
                  <span className="ml-24">I continually refine my craft</span> by exploring new techniques in large-scale tattooing and
                  symbolic composition. This allows me to create transformative pieces that capture personal stories and inner strength.
                </MainContentText>
              </div>

              <SeparatorLine />

              <div className="w-full">
                <MainContentText>
                  <span className="ml-24">Over the years, I've created</span> countless full-leg, full-arm, and back pieces featuring
                  elements like pendulums, castles, ships, wolves, and dragons. Each tattoo represents a personal journey
                  and legacy for its owner, reflecting their unique story and transformation.
                </MainContentText>
              </div>
            </div>
          </section>

          {/* My Approach Section */}
          <section className="relative z-10 min-h-screen text-white px-12 py-16">
            <div className="w-full h-full flex flex-col justify-center">
              <SectionHeader
                title="Philosophy"
                subtitle={
                  <>
                    My approach
                    <br />
                    to tattooing
                  </>
                }
              />

              <div className="flex justify-between items-center mb-16">
                <p className="text-xl font-bold leading-none">
                  Art as a form of
                  <br />
                  self-expression.
                </p>
                <Link href="/booking" className="flex items-center gap-2 text-xl hover:opacity-70 transition-opacity">
                  <CornerDownRight className="w-5 h-5" />
                  Book consultation
                </Link>
              </div>

              <SeparatorLine />

              <div className="w-full mb-24">
                <MainContentText className="mb-16">
                  <span className="ml-24">I believe tattooing</span> is not just body art but a form of living storytelling
                  and personal transformation. That's why I create a calm, focused environment where clients feel truly
                  heard and involved in bringing their vision to life.
                </MainContentText>
              </div>

              <SeparatorLine />

              <div className="w-full">
                <MainContentText>
                  <span className="ml-24">If you'd like to create</span> a powerful, custom tattoo that captures your personal narrative
                  and inner strength, I'd be honored to work with you. Book a consultation in Wiesbaden, Frankfurt, Berlin, Vienna, Munich, or Zurich,
                  and together we'll design your transformative piece.
                </MainContentText>
              </div>
            </div>
          </section>
        </div>

        {/* Instagram Section */}
        <InstagramSection />
      </main>

      <Footer />
    </div>
  )
}
