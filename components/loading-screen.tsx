"use client"

import { useEffect, useState } from "react"

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [percentage, setPercentage] = useState(1)
  const [isTextVisible, setIsTextVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [secondScreenVisible, setSecondScreenVisible] = useState(true)

  useEffect(() => {
    // Start text fade in immediately (no delay)
    setIsTextVisible(true)

    // Animate percentage from 1 to 100 over 4 seconds
    const startTime = Date.now()
    const duration = 4000 // 4 seconds

    const updatePercentage = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentPercentage = Math.floor(1 + progress * 99)

      setPercentage(currentPercentage)

      if (progress < 1) {
        requestAnimationFrame(updatePercentage)
      }
    }

    requestAnimationFrame(updatePercentage)

    // Start exit animation after 2.5 seconds
    const exitTimer = setTimeout(() => {
      setIsExiting(true)

      // Start fading out second screen after first screen exits (1.5 seconds)
      setTimeout(() => {
        setSecondScreenVisible(false)

        // Complete loading after fade out (1 second)
        setTimeout(() => {
          onComplete()
        }, 1000)
      }, 1500)
    }, 2500)

    return () => {
      clearTimeout(exitTimer)
    }
  }, [onComplete])

  return (
    <>
      {/* Second Loading Screen - black background (always rendered below) */}
      <div className={`second-loading-screen ${secondScreenVisible ? "visible" : "fading"}`}>
        <img 
          src="/images/bow-arrow.svg" 
          alt="Bow Arrow" 
          className="key-icon"
          style={{
            width: '150px',
            height: '150px',
            filter: 'brightness(0) invert(1)' // This makes the image completely white
          }}
        />
      </div>

      {/* First Loading Screen - white background (rendered on top) */}
      <div className={`loading-screen ${isExiting ? "exiting" : ""}`}>
        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${(percentage / 100) * 100}%`,
            }}
          />
        </div>

        {/* Percentage text */}
        <div className={`percentage-text ${isTextVisible ? "visible" : ""}`}>{percentage}<span className="didot-thin">%</span></div>
      </div>
    </>
  )
}