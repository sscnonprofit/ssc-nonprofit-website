"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { ZoomInIcon, ZoomOutIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { getCroppedImageBlob } from "@/lib/cms/crop-image"

export function ImageCropDialog({
  open,
  imageSrc,
  aspect = 16 / 9,
  mimeType = "image/jpeg",
  onOpenChange,
  onCropped,
}: {
  open: boolean
  imageSrc: string | null
  aspect?: number
  /** Output format for the uploaded image. */
  mimeType?: string
  onOpenChange: (open: boolean) => void
  onCropped: (blob: Blob) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  function reset() {
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  /** `useCrop` false keeps the whole picture (only scaled down if very large). */
  async function handleConfirm(useCrop: boolean) {
    if (!imageSrc || (useCrop && !croppedArea)) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, useCrop ? croppedArea : null, mimeType)
      onCropped(blob)
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error("Image crop failed:", error)
      toast.error(error instanceof Error ? error.message : "Could not process this image. Try a different file.")
    } finally {
      setIsProcessing(false)
    }
  }

  const shape = aspect < 1 ? "portrait" : aspect > 1 ? "landscape" : "square"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isProcessing) return
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>Adjust image</DialogTitle>
          <DialogDescription>
            The frame matches how this image appears on the website ({shape}). Drag to reposition and use the slider to
            zoom, or use the full image without cropping.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[min(22rem,50dvh)] w-full touch-none overflow-hidden rounded-lg bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOutIcon className="size-4 shrink-0 text-muted-foreground" />
          <Slider
            aria-label="Zoom"
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
          />
          <ZoomInIcon className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleConfirm(false)} disabled={isProcessing || !imageSrc}>
            Use full image
          </Button>
          <Button onClick={() => handleConfirm(true)} disabled={isProcessing || !croppedArea}>
            {isProcessing ? "Processing..." : "Apply crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
