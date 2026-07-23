"use client"

import { X } from "lucide-react"
import { useEffect } from "react"

interface LightboxProps {
  open: boolean
  onClose: () => void
  image: string
}

export function Lightbox({ open, onClose, image }: LightboxProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "auto"
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="max-w-full max-h-full overflow-auto">
        <img
          src={image || "/placeholder.svg"}
          alt="Enlarged image"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  )
}
