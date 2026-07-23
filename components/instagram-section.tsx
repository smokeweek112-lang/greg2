"use client"

import Image from "next/image"
import { CornerRightDown } from "lucide-react"
import InfiniteImageCarousel from "@/components/slider"

export default function InstagramSection() {
  return (
    <section className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-12 py-16">
      <div className="w-full h-full flex flex-col justify-center">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 md:mb-8">
            <p className="text-base sm:text-lg font-bold">Press/General Inquiries</p>
            <CornerRightDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-3xl sm:text-5xl md:text-8xl ars-light mb-8 sm:mb-12 md:mb-16">
            <a href="mailto:yehormelashych@gmail.com">yehormelashych@gmail.com</a>
          </p>
        </div>

        {/* Full width separator line - darker */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-px bg-neutral-600 mb-8 sm:mb-12 md:mb-16"></div>

        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 md:mb-8">
            <p className="text-base sm:text-lg font-bold">Instagram</p>
            <CornerRightDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-3xl sm:text-5xl md:text-8xl ars-light mb-8 sm:mb-12 md:mb-16">@gregormel</p>
        </div>

        {/* Full width horizontal scrolling images - smooth infinite animation */}
        <InfiniteImageCarousel className="py-6"/>

        {/* Separator line after images */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-px bg-neutral-600"></div>
      </div>
    </section>
  )
}
