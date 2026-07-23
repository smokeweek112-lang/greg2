"use client"

import { useState, useEffect, useCallback } from "react"

// Throttle function to optimize scroll performance
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

export default function ScrollIndicators() {
  const [scrollPercentage, setScrollPercentage] = useState(0)

  const handleScroll = useCallback(
    throttle(() => {
      const scrollTop = window.pageYOffset
      const docHeight = document.body.offsetHeight - window.innerHeight
      const scrollPercent = Math.round((scrollTop / docHeight) * 100)
      setScrollPercentage(scrollPercent)
    }, 16), // ~60fps
    [],
  )

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Calculate opacity for SCROLL text
  // At 90% - fully visible (opacity: 1)
  // At 100% - fully transparent (opacity: 0)
  const scrollOpacity = scrollPercentage >= 90 ? Math.max(0, 1 - (scrollPercentage - 90) / 10) : 1

  return (
    <>
      <div className="fixed bottom-4 left-4 z-30 text-sm">WIESBADEN, FFM, BERLIN</div>
      <div
        className="fixed bottom-4 right-4 z-30 text-sm transition-opacity duration-300"
        style={{ opacity: scrollOpacity }}
      >
        SCROLL ({scrollPercentage}%)
      </div>
    </>
  )
}
