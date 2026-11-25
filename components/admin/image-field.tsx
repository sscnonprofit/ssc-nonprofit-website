"use client"

import { createContext, useContext, useRef, useState } from "react"
import { ImageIcon, Loader2Icon, PencilIcon, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImageCropDialog } from "@/components/admin/image-crop-dialog"
import { outputType } from "@/lib/cms/crop-image"
import { cn } from "@/lib/utils"

/**
 * Crop frame shape (width / height) for image fields rendered inside it, for
 * editors that build fields generically, e.g. portrait leadership photos.
 */
export const ImageAspectContext = createContext<number | undefined>(undefined)

export function ImageField({
  label,
  value,
  onChange,
  aspect: aspectProp,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  aspect?: number
}) {
  const contextAspect = useContext(ImageAspectContext)
  const aspect = aspectProp ?? contextAspect ?? 16 / 9
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingSrc, setPendingSrc] = useState<string | null>(null)
  const [pendingType, setPendingType] = useState("image/jpeg")
  const [cropOpen, setCropOpen] = useState(false)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, WEBP, or AVIF image")
      return
    }
    // The picture is scaled down before upload, so large phone photos are fine.
    if (file.size > 30 * 1024 * 1024) {
      toast.error("Choose an image smaller than 30 MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPendingSrc(reader.result as string)
      setPendingType(outputType(file.type))
      setCropOpen(true)
    }
    reader.onerror = () => toast.error("Could not read this file")
    reader.readAsDataURL(file)
  }

  async function handleCropped(blob: Blob) {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", blob, `image.${blob.type.split("/")[1] || "jpg"}`)
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ? `Upload failed: ${data.error}` : "Upload failed")
      }
      const data = await res.json()
      onChange(data.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the image")
    } finally {
      setIsUploading(false)
      setPendingSrc(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <div
        className={cn(
          "group relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors",
          aspect < 1 ? "max-w-[14rem]" : "max-w-sm",
          isDragging && "border-primary bg-primary/5"
        )}
        style={{ aspectRatio: aspect }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value || "/placeholder.svg"} alt={label} className="size-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-background/85 p-2 backdrop-blur-sm transition-opacity [@media(hover:hover)]:inset-0 [@media(hover:hover)]:bg-background/70 [@media(hover:hover)]:p-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
              <Button type="button" size="sm" variant="secondary" className="h-9" onClick={() => inputRef.current?.click()} disabled={isUploading}>
                <PencilIcon className="size-3.5" />
                Replace
              </Button>
              <Button type="button" size="sm" variant="destructive" className="h-9" onClick={() => onChange("")} disabled={isUploading}>
                <XIcon className="size-3.5" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground transition-colors hover:text-foreground sm:p-6"
          >
            {isUploading ? <Loader2Icon className="size-6 animate-spin" /> : <ImageIcon className="size-6" />}
            <span className="text-sm font-medium">{isUploading ? "Uploading..." : "Drop an image or click to upload"}</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <UploadIcon className="size-3" />
              PNG, JPG, or WEBP
            </span>
          </button>
        )}

        {isUploading && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <ImageCropDialog open={cropOpen} imageSrc={pendingSrc} aspect={aspect} mimeType={pendingType} onOpenChange={setCropOpen} onCropped={handleCropped} />
    </div>
  )
}
