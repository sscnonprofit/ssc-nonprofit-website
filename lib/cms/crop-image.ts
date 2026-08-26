export type CropArea = { x: number; y: number; width: number; height: number }

/** Loads an image and returns a cropped JPEG/PNG blob based on pixel crop coordinates from react-easy-crop. */
export async function getCroppedImageBlob(imageSrc: string, crop: CropArea, mimeType = "image/jpeg"): Promise<Blob> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement("canvas")
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to create image blob"))
      },
      mimeType,
      0.92
    )
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}
