"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { getCroppedImageBlob } from "@/lib/cms/crop-image"

export function ImageCropDialog({
  open,
  imageSrc,
  aspect = 16 / 9,
  onOpenChange,
  onCropped,
}: {
  open: boolean
  imageSrc: string | null
  aspect?: number
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

  async function handleConfirm() {
    if (!imageSrc || !croppedArea) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea)
      onCropped(blob)
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Crop failed:", error)
    } finally {
      setIsProcessing(false)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setZoom(1)
          setCrop({ x: 0, y: 0 })
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust image</DialogTitle>
          <DialogDescription>Drag to reposition and use the slider to zoom before saving.</DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
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
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(value) => setZoom(Array.isArray(value) ? value[0] : value)}
          />
          <ZoomInIcon className="size-4 shrink-0 text-muted-foreground" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || !croppedArea}>
            {isProcessing ? "Processing..." : "Apply crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
