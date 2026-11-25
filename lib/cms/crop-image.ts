export type CropArea = { x: number; y: number; width: number; height: number }

/** Uploads are capped to this many pixels on the long edge. Site images are served unoptimized. */
export const MAX_IMAGE_EDGE = 2400

/** PNG and WEBP keep their format (and transparency); everything else becomes JPEG. */
export function outputType(sourceType: string) {
  return sourceType === "image/png" || sourceType === "image/webp" ? sourceType : "image/jpeg"
}

/**
 * Returns the cropped area as an image blob, scaled down so its long edge is at
 * most `maxEdge`. Pass no crop to keep the whole image (only resized).
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  crop: CropArea | null,
  mimeType = "image/jpeg",
  maxEdge = MAX_IMAGE_EDGE,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const area = crop ?? { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight }
  const scale = Math.min(1, maxEdge / Math.max(area.width, area.height))

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(area.width * scale))
  canvas.height = Math.max(1, Math.round(area.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to create image blob"))
      },
      mimeType,
      0.9,
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not read this image"))
    image.src = src
  })
}
