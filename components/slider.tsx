"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type ImageItem = {
  id: number
  src: string
  alt?: string
}

type InfiniteImageCarouselProps = {
  items?: ImageItem[]
  imageWidth?: number
  imageHeight?: number
  gapPx?: number
  /** Seconds it takes one full set of items to scroll past */
  durationSec?: number
  className?: string
}

const DEFAULT_ITEMS: ImageItem[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  src: `/images/examples/example${i + 1}.jpg`,
  alt: `Tattoo work ${i + 1}`,
}))

export default function InfiniteImageCarousel({
  items = DEFAULT_ITEMS,
  imageWidth = 150,
  imageHeight = 200,
  gapPx = 16,
  durationSec = 14,
  className,
}: InfiniteImageCarouselProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [copies, setCopies] = useState(4)

  // Every figure carries a trailing margin, so the track width is always an
  // exact multiple of one set's width and the -50% loop stays seamless.
  const setWidth = items.length * (imageWidth + gapPx)

  // The track animates by -50% of its own width, so half of it must be at
  // least as wide as the container — otherwise the loop shows a gap on wide
  // screens. Render however many copies that takes for the current viewport.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      setCopies(Math.max(2, 2 * Math.ceil(el.offsetWidth / setWidth)))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [setWidth])

  const track = Array.from({ length: copies }, () => items).flat()

  return (
    <section
      ref={containerRef}
      aria-label="Infinite image carousel"
      className={cn("overflow-hidden", className)}
    >
      <div
        className="flex w-max items-center will-change-transform"
        style={{
          // Duration scales with the number of copies so the pixel speed
          // stays the same on every screen size.
          animation: `carousel-scroll ${(durationSec * copies) / 2}s linear infinite`,
        }}
      >
        {track.map((item, idx) => {
          const isDuplicate = idx >= items.length

          return (
            <figure
              key={`${item.id}-${idx}`}
              className="relative shrink-0"
              style={{
                width: imageWidth,
                height: imageHeight,
                marginRight: gapPx,
              }}
              aria-hidden={isDuplicate || undefined}
            >
              <img
                src={item.src || "/placeholder.svg"}
                width={imageWidth}
                height={imageHeight}
                alt={isDuplicate ? "" : item.alt ?? ""}
                className="block h-full w-full object-cover select-none pointer-events-none"
                draggable={false}
                loading="lazy"
              />
            </figure>
          )
        })}
      </div>

      <style>{`
        @keyframes carousel-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
