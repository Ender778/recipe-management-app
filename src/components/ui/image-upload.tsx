"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Camera, Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  onImageUpload: (url: string) => void
  currentImage?: string
  disabled?: boolean
}

export function ImageUpload({ onImageUpload, currentImage, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous messages
    setError(null)
    setSuccess(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB. Please choose a smaller file.')
      return
    }

    setIsUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Server error occurred' }))
        throw new Error(errorData.error || `Upload failed (Error ${response.status})`)
      }

      const { url } = await response.json()
      onImageUpload(url)
      setSuccess('Image uploaded successfully!')

    } catch (error) {
      // Fallback: use the preview URL (base64) directly
      if (previewUrl && previewUrl.startsWith('data:')) {
        onImageUpload(previewUrl)
        setSuccess('Image saved! (Using backup method)')
        return
      }
      
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPreviewUrl(currentImage || null)
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUpload('')
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <Label>Recipe Image</Label>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}
      
      {previewUrl ? (
        <div className="relative w-full max-w-md">
          <div className="relative aspect-video rounded-lg overflow-hidden border">
            <Image
              src={previewUrl}
              alt="Recipe preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-md aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">No image selected</p>
            <p className="text-xs text-gray-500">Click below to add one</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        capture="environment" // This suggests using the rear camera on mobile
      />

      <p className="text-xs text-gray-500">
        Supported formats: JPG, PNG, GIF. Max size: 5MB
      </p>
    </div>
  )
}
