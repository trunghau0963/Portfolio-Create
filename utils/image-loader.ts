/**
 * Custom image loader for optimizing images
 * This can be used with Next.js Image component
 */

type ImageLoaderProps = {
    src: string
    width: number
    quality?: number
  }
  
  /**
   * Custom image loader that optimizes images based on device size
   */
  export function imageLoader({ src, width, quality = 75 }: ImageLoaderProps) {
    // For placeholder SVGs, return as is
    if (src.includes("placeholder.svg")) {
      return src
    }
  
    // For blob URLs (uploaded images), return as is
    if (src.startsWith("blob:")) {
      return src
    }
  
    // For picsum.photos, use their sizing parameters
    if (src.includes("picsum.photos")) {
      const urlParts = src.split("?")
      const baseUrl = urlParts[0]
      const params = urlParts.length > 1 ? urlParts[1] : ""
  
      // Extract dimensions from URL
      const dimensionsMatch = baseUrl.match(/\/(\d+)\/(\d+)/)
      if (dimensionsMatch) {
        const height = Math.round((width * Number.parseInt(dimensionsMatch[2])) / Number.parseInt(dimensionsMatch[1]))
        const newBaseUrl = baseUrl.replace(/\/\d+\/\d+/, `/${width}/${height}`)
        return `${newBaseUrl}${params ? `?${params}` : ""}`
      }
      return src
    }
  
    // For other images, return as is
    return src
  }
  
  /**
   * Generates a low-quality placeholder image URL
   * @param src Original image URL
   * @returns A low-quality version of the image for use as a placeholder
   */
  export function generateBlurPlaceholder(src: string): string {
    if (!src || src.includes("placeholder.svg") || src.startsWith("data:")) {
      return "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
    }
  
    if (src.startsWith("blob:")) {
      return "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="
    }
  
    // For picsum.photos, create a tiny version
    if (src.includes("picsum.photos")) {
      const urlParts = src.split("?")
      const baseUrl = urlParts[0]
      const params = urlParts.length > 1 ? urlParts[1] : ""
  
      // Extract dimensions from URL
      const dimensionsMatch = baseUrl.match(/\/(\d+)\/(\d+)/)
      if (dimensionsMatch) {
        return `${baseUrl.replace(/\/\d+\/\d+/, "/10/10")}${params ? `?${params}` : ""}`
      }
    }
  
    return src
  }
  