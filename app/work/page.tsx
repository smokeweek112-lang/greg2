"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ScrollIndicators from "@/components/scroll-indicators"
import InstagramSection from "@/components/instagram-section"

function useScrollProgress(ref: React.RefObject<HTMLDivElement>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleScroll = () => {
      const { top, height } = el.getBoundingClientRect()
      const windowH = window.innerHeight
      const p = (windowH - top) / (windowH + height)
      setProgress(Math.min(1, Math.max(0, p)))
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [ref])

  return progress
}

const workImages = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  src: `/images/examples/example${i + 1}.jpg`,
  alt: `Tattoo work ${i + 1}`,
}))

export default function Work() {
  const [scrollY, setScrollY] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden">
      <ScrollIndicators />
      <Header />

      <main className="flex-1">
        {/* Work Section */}
        <section className="min-h-screen px-4 sm:px-8 md:px-12 py-16 pt-32">
          <h1 className="text-9xl font-bold mb-12">
            W<span className="ars-demibold">O</span>RK
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {workImages.map((image, index) => {
              const baseRotation = Math.sin(index * 0.5) * 8
              const minScale = 0.8
              const maxScale = 0.5
              const ref = useRef<HTMLDivElement>(null)
              const prog = useScrollProgress(ref)

              const vanishingEffect = prog > 0.5 ? (prog - 0.5) * 2 : 0
              const rawRotation = baseRotation * vanishingEffect
              const rotation = Number(rawRotation.toFixed(2))
              const opacity = Number((1.0 - vanishingEffect * 0.8).toFixed(2))
              const scale = Number((minScale + vanishingEffect * (maxScale - minScale)).toFixed(2))

              return (
                <div
                  key={image.id}
                  ref={ref}
                  className={`relative overflow-hidden transition-all duration-200 ease-out`}
                  style={{
                    opacity,
                    transform: `rotate(${rotation}deg) scale(${scale})`
                  }}
                >
                  <div className="aspect-[4/5] rounded-lg overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Instagram Section */}
        <InstagramSection />
      </main>

      <Footer />
    </div>
  )
}