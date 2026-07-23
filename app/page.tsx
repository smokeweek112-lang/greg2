"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, CornerRightDown, CornerDownRight, X } from "lucide-react"
import LoadingScreen from "@/components/loading-screen"
import ScrollIndicators from "@/components/scroll-indicators"
import Header from "@/components/header"
import Footer from "@/components/footer"
import InstagramSection from "@/components/instagram-section"
import VideoBackground from "@/components/video-background"

// Utility: throttle function for scroll event
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Utility: get distance between two touch points
const getDistance = (touch1: Touch, touch2: Touch) => {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// Utility: get center point between two touches
const getCenter = (touch1: Touch, touch2: Touch) => {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  }
}

// Modal component for viewing images
// Replace the ImageModal component in your page.tsx with this fixed version

const ImageModal = ({ 
  isOpen, 
  imageUrl, 
  alt, 
  onClose 
}: { 
  isOpen: boolean
  imageUrl: string
  alt: string
  onClose: () => void 
}) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  // Mouse/Desktop states
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Touch/Mobile states
  const [initialTouchDistance, setInitialTouchDistance] = useState(0)
  const [initialScale, setInitialScale] = useState(1)
  const [initialTouchCenter, setInitialTouchCenter] = useState({ x: 0, y: 0 })
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 })
  const [isTouching, setIsTouching] = useState(false)
  
  // Ref for image container to add native event listeners
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Reset scale and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      // Block page scroll
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      // Restore page scroll
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [isOpen])

  // Handle wheel zoom for desktop - native event
  const handleModalWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY * -0.001
    const newScale = Math.min(Math.max(0.5, scale + delta), 4)
    setScale(newScale)
    
    // Reset position when scaling down to 1 or less
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  // Block page scroll when modal is open
  const handlePageWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Handle touch start for mobile - native event
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault()
    setIsTouching(true)
    
    if (e.touches.length === 2) {
      // Two finger pinch
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = getDistance(touch1, touch2)
      const center = getCenter(touch1, touch2)
      
      setInitialTouchDistance(distance)
      setInitialScale(scale)
      setInitialTouchCenter(center)
      setInitialPosition(position)
    } else if (e.touches.length === 1 && scale > 1) {
      // Single finger drag (only when zoomed)
      const touch = e.touches[0]
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y
      })
      setIsDragging(true)
    }
  }, [scale, position])

  // Handle touch move for mobile - native event
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2) {
      // Two finger pinch zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = getDistance(touch1, touch2)
      const center = getCenter(touch1, touch2)
      
      if (initialTouchDistance > 0) {
        const scaleChange = distance / initialTouchDistance
        const newScale = Math.min(Math.max(0.5, initialScale * scaleChange), 4)
        
        // Calculate new position based on zoom center
        const deltaX = center.x - initialTouchCenter.x
        const deltaY = center.y - initialTouchCenter.y
        
        setScale(newScale)
        
        if (newScale <= 1) {
          setPosition({ x: 0, y: 0 })
        } else {
          setPosition({
            x: initialPosition.x + deltaX,
            y: initialPosition.y + deltaY
          })
        }
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Single finger drag
      const touch = e.touches[0]
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      })
    }
  }, [initialTouchDistance, initialScale, initialTouchCenter, initialPosition, isDragging, dragStart, scale])

  // Handle touch end for mobile - native event
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault()
    setIsTouching(false)
    setIsDragging(false)
    setInitialTouchDistance(0)
    setInitialScale(1)
  }, [])

  // Handle mouse down for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  // Handle mouse move for desktop
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart, scale])

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // Prevent page scroll on touch
  const handlePageTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
  }, [])

  // Add event listeners
  useEffect(() => {
    if (isOpen) {
      const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e)
      const mouseUpHandler = () => handleMouseUp()
      const keyDownHandler = (e: KeyboardEvent) => handleKeyDown(e)

      // Block page scroll for wheel events
      document.addEventListener('wheel', handlePageWheel, { passive: false })
      
      // Block page scroll for touch events
      document.addEventListener('touchmove', handlePageTouchMove, { passive: false })
      
      // Desktop events
      document.addEventListener('mousemove', mouseMoveHandler, { passive: false })
      document.addEventListener('mouseup', mouseUpHandler)
      document.addEventListener('keydown', keyDownHandler)
      
      // Touch events and wheel events for image container
      const imageContainer = imageContainerRef.current
      if (imageContainer) {
        imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false })
        imageContainer.addEventListener('touchmove', handleTouchMove, { passive: false })
        imageContainer.addEventListener('touchend', handleTouchEnd, { passive: false })
        // Add wheel event to image container as non-passive
        imageContainer.addEventListener('wheel', handleModalWheel, { passive: false })
      }
      
      // Prevent context menu and drag events on document
      const preventContextMenu = (e: Event) => e.preventDefault()
      const preventDragStart = (e: Event) => e.preventDefault()
      
      document.addEventListener('contextmenu', preventContextMenu)
      document.addEventListener('dragstart', preventDragStart)

      return () => {
        document.removeEventListener('wheel', handlePageWheel)
        document.removeEventListener('touchmove', handlePageTouchMove)
        document.removeEventListener('mousemove', mouseMoveHandler)
        document.removeEventListener('mouseup', mouseUpHandler)
        document.removeEventListener('keydown', keyDownHandler)
        document.removeEventListener('contextmenu', preventContextMenu)
        document.removeEventListener('dragstart', preventDragStart)
        
        // Remove touch events and wheel events from image container
        if (imageContainer) {
          imageContainer.removeEventListener('touchstart', handleTouchStart)
          imageContainer.removeEventListener('touchmove', handleTouchMove)
          imageContainer.removeEventListener('touchend', handleTouchEnd)
          imageContainer.removeEventListener('wheel', handleModalWheel)
        }
      }
    }
  }, [isOpen, handleMouseMove, handleMouseUp, handleKeyDown, handlePageWheel, handlePageTouchMove, handleTouchStart, handleTouchMove, handleTouchEnd, handleModalWheel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors p-2"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image container */}
      <div
        ref={imageContainerRef}
        className="relative max-w-full max-h-full touch-none"
        onMouseDown={handleMouseDown}
        // Remove the onWheel handler since we're using native event listeners
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: (isDragging || isTouching) ? 'none' : 'transform 0.2s ease',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image
          src={imageUrl}
          alt={alt}
          width={800}
          height={1000}
          className="max-w-[90vw] max-h-[90vh] object-contain select-none pointer-events-none"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  )
}

export default function Home() {
  //--- Loading state ---
  const [isLoading, setIsLoading] = useState(true)

  //--- Parallax scroll state ---
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(0)

  //--- Modal state ---
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    imageUrl: string
    alt: string
  }>({
    isOpen: false,
    imageUrl: '',
    alt: ''
  })

  //--- Handlers ---
  const handleLoadingComplete = () => setIsLoading(false)

  const handleScroll = useCallback(
    throttle(() => {
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }, 8),
    []
  )

  const openModal = (imageUrl: string, alt: string) => {
    setModalState({ isOpen: true, imageUrl, alt })
  }

  const closeModal = () => {
    setModalState({ isOpen: false, imageUrl: '', alt: '' })
  }

  //--- Effects ---

  // 1) Loading effect: lock/unlock scroll
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"

      const scrollPosition = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollPosition}px`
      document.body.style.width = "100%"
    } else {
      const top = document.body.style.top
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""

      if (top) window.scrollTo(0, parseInt(top) * -1)
    }

    return () => {
      // Cleanup on unmount
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }
  }, [isLoading])

  // 2) Initialize scroll listener & windowHeight
  useEffect(() => {
    setWindowHeight(window.innerHeight)

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", () => setWindowHeight(window.innerHeight))

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", () => setWindowHeight(window.innerHeight))
    }
  }, [handleScroll])

  return (
    <>
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      <div className="min-h-screen bg-black text-white flex flex-col relative overflow-x-hidden">
        <ScrollIndicators />
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative h-screen flex items-end justify-start overflow-hidden">
            <div
              className="absolute inset-0 w-full h-[150%] bg-cover bg-no-repeat will-change-transform brightness-75 bg-[position:35%_center] sm:bg-[position:50%_center]"
              style={{
                backgroundImage: "url('/images/background.jpg')",
                transform: `translateY(${scrollY * -0.2}px)`,
                top: "-25%",
              }}
            />
          </section>

          {/* Book Experience Section */}
          <section className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-12 pb-16 flex flex-col justify-center">
            <div className="w-full">
              <div className="mb-16 sm:mb-24 md:mb-32">
                <Link href="/booking" className="block group mb-12 sm:mb-16 md:mb-24">
                  <div className="bg-black text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex items-center justify-between h-20 sm:h-24 md:h-32 border-t border-b border-neutral-600 transition-colors duration-300 pl-4 sm:pl-8 md:pl-12">
                    <h2 className="text-3xl sm:text-5xl md:text-8xl font-light">Book Experience</h2>
                    <div className="relative w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 group-hover:bg-white group-hover:text-black transition-colors duration-300 border-l border-neutral-600">
                      <div className="w-full h-full flex items-center justify-center">
                        <ArrowUpRight className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16" />
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="mb-16">
                  <p className="text-base sm:text-lg md:text-xl font-bold leading-none mb-8 sm:mb-12 md:mb-16">
                    Exploring art
                    <br />
                    through tattooing.
                  </p>

                  {/* Full width separator line - darker */}
                  <div className="w-full h-px bg-neutral-600 mb-8 sm:mb-12 md:mb-16"></div>

                  <div className="w-full">
                    <p className="text-2xl sm:text-4xl md:text-8xl font-light leading-tight">
                      <span className="ml-16 sm:ml-32 md:ml-64"></span>My artistic journey began in Wiesbaden, where childhood was filled 
                      with exploring dark themes through sketching, painting gothic scenes, and crafting symbolic jewelry. 
                      These early years of working with shadows, mythology, and personal symbolism laid the foundation 
                      for my distinctive tattooing approach.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Explore Work Section */}
          <section className="min-h-screen bg-black text-white px-4 sm:px-8 md:px-12 py-16">
            <div className="w-full h-full flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-base sm:text-lg font-bold">Diversity of thought</p>
                  <CornerRightDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              <div className="text-center mb-12 sm:mb-16 md:mb-24">
                <h2 className="text-4xl sm:text-6xl md:text-9xl font-light leading-tight">
                  Explore work
                  <br />
                  and tattooing
                </h2>
              </div>

              <div className="flex justify-between items-center w-full gap-2 sm:gap-4 mb-8 sm:mb-12 md:mb-16 font-light leading-none">
                <p className="flex-1 text-xl sm:text-2xl md:text-3xl leading-none m-0 text-left">
                  Combine our ideas and transform them into a tattoo.
                </p>
                <Link
                  href="/work"
                  className="flex items-center gap-1 sm:gap-2 text-lg sm:text-xl md:text-2xl hover:opacity-70 transition-opacity whitespace-nowrap leading-none"
                >
                  <CornerDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  See the work
                </Link>
              </div>

              {/* Images - mobile: horizontal scroll, desktop: 3 column grid */}
              <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                {/* Mobile: Horizontal scroll */}
                <div className="sm:hidden overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 px-2" style={{ width: 'max-content' }}>
                    {[1, 2, 3].map((index) => (
                      <div 
                        key={index} 
                        className="aspect-[4/5] relative overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                        style={{ width: 'calc(100vw - 16px)' }}
                        onClick={() => openModal(`/images/examples/example${index}.jpg`, `Tattoo ${index}`)}
                      >
                        <Image
                          src={`/images/examples/example${index}.jpg`}
                          alt={`Tattoo ${index}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop: 3 column grid */}
                <div className="hidden sm:block px-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((index) => (
                      <div 
                        key={index} 
                        className="aspect-[4/5] relative overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openModal(`/images/examples/example${index}.jpg`, `Tattoo ${index}`)}
                      >
                        <Image
                          src={`/images/examples/example${index}.jpg`}
                          alt={`Tattoo ${index}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Parallax Video Section */}
          <section className="relative h-[150vh] bg-black overflow-hidden">
            <div
              className="absolute inset-0 w-full h-[150%] will-change-transform"
              style={{
                transform: `translate3d(0, ${windowHeight > 0 ? (scrollY - windowHeight * 2) * 0.2 : 0}px, 0)`,
                top: "-50%",
              }}
            >
              <VideoBackground scrollY={scrollY} windowHeight={windowHeight} />
            </div>

            {/* Black overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-black"></div>
              <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-black"></div>
            </div>
          </section>

          {/* Studio Intro Section */}
          <section className="min-h-0 md:min-h-screen flex flex-col md:flex-row bg-black text-white">
            {/* Left: Full-height Image - Hidden on mobile */}
            <div className="relative w-full md:w-1/2 h-[60vh] md:h-auto hidden md:block">
              <Image src="/images/detailed.jpg" alt="About me" fill className="object-cover" priority />
            </div>
            {/* Right: Top-aligned text with bottom full-width button */}
            <div className="relative w-full md:w-1/2 flex flex-col justify-between px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-12">
              <div>
                <h2 className="text-4xl sm:text-6xl md:text-8xl font-light mb-4 sm:mb-6 mt-2 sm:mt-4 md:mt-0">
                  About me
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl leading-relaxed max-w-[30rem]">
                  <span className="ml-8 sm:ml-16 md:ml-16"></span>Professional tattoo artist with over 11 years of experience, 
                  specializing in realistic, dark fantasy, Chicano, and portrait styles. My work is deeply inspired by storytelling, 
                  emotion, and symbolic composition — every tattoo I create is a personal narrative captured on skin.
                </p>
              </div>
              <Link
                href="/about"
                className="w-full h-12 sm:h-14 md:h-16 mt-12 sm:mt-14 md:mt-16 border border-neutral-600 text-white font-semibold flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300 text-sm sm:text-base"
              >
                VISIT NOW
              </Link>
            </div>
          </section>

          {/* Instagram Section */}
          <InstagramSection />

          {/* Footer Section */}
          <Footer />
        </main>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalState.isOpen}
        imageUrl={modalState.imageUrl}
        alt={modalState.alt}
        onClose={closeModal}
      />
    </>
  )
}