/**
 * Rasterize a same-origin SVG URL to PNG bytes for jsPDF / docx ImageRun.
 */
export async function rasterizeSvgFromUrl(url: string, outWidth: number, outHeight: number): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load image: ${url}`)
  const text = await res.text()
  const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('SVG image decode failed'))
      i.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = outWidth
    canvas.height = outHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas unsupported')
    ctx.drawImage(img, 0, 0, outWidth, outHeight)
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!pngBlob) throw new Error('PNG encode failed')
    return new Uint8Array(await pngBlob.arrayBuffer())
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
