"use client"

import { useEffect, useRef, useCallback } from "react"

interface CloudflareTurnstileProps {
  onVerify: (token: string) => void
  onError: () => void
  onExpire: () => void
  sitekey?: string
}

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: any) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export default function CloudflareTurnstile({ onVerify, onError, onExpire, sitekey }: CloudflareTurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const isLoadedRef = useRef(false)

  // Memorize callbacks to prevent unnecessary re-renders
  const handleVerify = useCallback((token: string) => {
    console.log("✅ Turnstile verification successful:", token.substring(0, 20) + "...")
    onVerify(token)
  }, [onVerify])

  const handleError = useCallback((error: any) => {
    console.error("❌ Turnstile error:", error)
    onError()
  }, [onError])

  const handleExpire = useCallback(() => {
    console.log("⏰ Turnstile token expired")
    onExpire()
  }, [onExpire])

  // Function to reset the widget
  const resetWidget = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      console.log("Resetting Turnstile widget:", widgetIdRef.current)
      try {
        window.turnstile.reset(widgetIdRef.current)
      } catch (error) {
        console.error("Error resetting Turnstile widget:", error)
      }
    }
  }, [])

  // Place the reset function in the global scope
  useEffect(() => {
    (window as any).resetTurnstile = resetWidget
    return () => {
      delete (window as any).resetTurnstile
    }
  }, [resetWidget])

  // Function for loading Turnstile
  const loadTurnstile = useCallback(() => {
    if (window.turnstile && containerRef.current && !isLoadedRef.current) {
      const finalSitekey = sitekey || getSiteKey() || "1x00000000000000000000AA"
      console.log("Loading Turnstile with sitekey:", finalSitekey)

      try {
        // Clear the container before creating a new widget
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: finalSitekey,
          callback: handleVerify,
          "error-callback": handleError,
          "expired-callback": handleExpire,
          theme: "dark",
          size: "normal",
          // Add refresh-expired for automatic refresh
          "refresh-expired": "auto",
          // Add refresh-expired for automatic refresh
          "response-field": false,
          "response-field-name": ""
        })

        console.log("Turnstile widget rendered with ID:", widgetIdRef.current)
        isLoadedRef.current = true
      } catch (error) {
        console.error("Error rendering Turnstile:", error)
        handleError(error)
      }
    }
  }, [sitekey, handleVerify, handleError, handleExpire])

  useEffect(() => {
    // Preventing multiple downloads
    if (isLoadedRef.current) return

    if (!window.turnstile) {
      // Check if the script is already loading
      const existingScript = document.querySelector('script[src*="turnstile"]')
      if (existingScript) {
        // Waiting for existing script to load
        const checkTurnstile = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkTurnstile)
            loadTurnstile()
          }
        }, 100)
        return () => clearInterval(checkTurnstile)
      }

      const script = document.createElement("script")
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js"
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log("Turnstile script loaded successfully")
        loadTurnstile()
      }
      
      script.onerror = (error) => {
        console.error("Failed to load Turnstile script:", error)
        handleError(error)
      }
      
      document.head.appendChild(script)
      
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    } else {
      loadTurnstile()
    }

    // Cleanup function
    return () => {
      if (widgetIdRef.current && window.turnstile && isLoadedRef.current) {
        try {
          console.log("Cleaning up Turnstile widget:", widgetIdRef.current)
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
          isLoadedRef.current = false
        } catch (error) {
          console.error("Error removing Turnstile widget:", error)
        }
      }
    }
  }, [loadTurnstile, handleError])

  // Prevent clicks on the container from popping up
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="turnstile-container" 
      onClick={handleContainerClick}
      style={{ minHeight: '65px' }} // Reserve space for the widget
    />
  )
}

export function getSiteKey(): string {
  return process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"
}