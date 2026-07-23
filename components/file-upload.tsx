"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileChange: (file: File | null) => void
  onFileDataUrl?: (dataUrl: string | null) => void
}

export default function FileUpload({ onFileChange, onFileDataUrl }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFile(file)
  }

  const handleFile = (file: File | null) => {
    onFileChange(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        if (onFileDataUrl) {
          onFileDataUrl(result)
        }
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
      if (onFileDataUrl) {
        onFileDataUrl(null)
      }
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
