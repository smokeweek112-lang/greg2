"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileChange: (file: File | null) => void
  onFileDataUrl?: (dataUrl: string | null) => void
}

// Cap the longest side and re-encode as JPEG. A raw phone photo can be several
// MB, which as base64 in the JSON body blows past Vercel's ~4.5 MB request limit
// (413 Content Too Large). A reference image doesn't need full resolution.
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("Failed to load image"))
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject(new Error("Canvas 2D context unavailable"))

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function FileUpload({ onFileChange, onFileDataUrl }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFile(file)
  }

  const handleFile = async (file: File | null) => {
    onFileChange(file)

    if (!file) {
      setPreview(null)
      onFileDataUrl?.(null)
      return
    }

    try {
      const dataUrl = await compressImage(file)
      setPreview(dataUrl)
      onFileDataUrl?.(dataUrl)
    } catch (error) {
      // If compression fails for any reason, fall back to the raw file so the
      // user can still submit (the server-side flow is unchanged).
      console.error("Image compression failed, using original:", error)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        onFileDataUrl?.(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0] || null
    handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onFileChange(null)
    if (onFileDataUrl) {
      onFileDataUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      {!preview ? (
        <div
          className={`border-2 border-dashed p-8 text-center rounded-none ${
            isDragging ? "border-black bg-neutral-50" : "border-neutral-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload className="h-10 w-10 text-neutral-400" />
            <div>
              <p className="text-base font-medium">Drag file here or</p>
              <p className="text-sm text-neutral-500">PNG, JPG or JPEG (max 5MB)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 rounded-none bg-white text-black border-white hover:bg-neutral-100"
            >
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview || "/placeholder.svg"}
            alt="Preview"
            className="w-full h-auto object-cover max-h-[300px] rounded-none"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-none"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
