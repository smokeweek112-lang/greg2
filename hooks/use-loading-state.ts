"use client"

import { useState, useEffect } from "react"

// Global loading state to prevent showing loading screen on navigation
let hasShownLoading = false

export function useLoadingState() {
  const [shouldShowLoading, setShouldShowLoading] = useState(false)

  useEffect(() => {
    // Only show loading screen if it hasn't been shown yet in this session
    if (!hasShownLoading) {
      setShouldShowLoading(true)
      hasShownLoading = true
    }
  }, [])

  const handleLoadingComplete = () => {
    setShouldShowLoading(false)
  }

  return {
    shouldShowLoading,
    handleLoadingComplete,
  }
}
