/**
 * Generates responsive image URLs for different screen sizes
 * @param baseUrl The base image URL
 * @param width The original image width
 * @param height The original image height
 * @returns An object with different sized image URLs
 */
export function getResponsiveImageUrl(
  baseUrl: string,
  width: number,
  height: number,
): {
  tiny: string
  small: string
  medium: string
  large: string
  original: string
} {
  // If the URL is empty or undefined, return placeholder URLs
  if (!baseUrl) {
    const randomId = Math.floor(Math.random() * 1000)
    const placeholderUrl = `https://picsum.photos/${width}/${height}?random=${randomId}`
    return {
      tiny: placeholderUrl,
      small: placeholderUrl,
      medium: placeholderUrl,
      large: placeholderUrl,
      original: placeholderUrl,
    }
  }

  // If it's a placeholder or doesn't contain picsum.photos, return the original
  if (baseUrl.includes("placeholder.svg") || (!baseUrl.includes("picsum.photos") && !baseUrl.startsWith("blob:"))) {
    return {
      tiny: baseUrl,
      small: baseUrl,
      medium: baseUrl,
      large: baseUrl,
      original: baseUrl,
    }
  }

  // For blob URLs (uploaded images), return the same URL for all sizes
  if (baseUrl.startsWith("blob:")) {
    return {
      tiny: baseUrl,
      small: baseUrl,
      medium: baseUrl,
      large: baseUrl,
      original: baseUrl,
    }
  }

  // For picsum.photos URLs, create responsive versions
  // Extract the random ID if present
  const randomIdMatch = baseUrl.match(/random=([^&]+)/)
  const randomId = randomIdMatch ? randomIdMatch[1] : ""

  // Calculate aspect ratio
  const aspectRatio = width / height

  // Create tiny version (for small mobile devices)
  const tinyWidth = 200
  const tinyHeight = Math.round(tinyWidth / aspectRatio)

  // Create small version (for mobile devices)
  const smallWidth = 400
  const smallHeight = Math.round(smallWidth / aspectRatio)

  // Create medium version (for tablets)
  const mediumWidth = 800
  const mediumHeight = Math.round(mediumWidth / aspectRatio)

  // Create large version (for desktops)
  const largeWidth = 1200
  const largeHeight = Math.round(largeWidth / aspectRatio)

  // Create URLs with appropriate sizes
  let tiny, small, medium, large

  if (randomId) {
    tiny = `https://picsum.photos/${tinyWidth}/${tinyHeight}?random=${randomId}`
    small = `https://picsum.photos/${smallWidth}/${smallHeight}?random=${randomId}`
    medium = `https://picsum.photos/${mediumWidth}/${mediumHeight}?random=${randomId}`
    large = `https://picsum.photos/${largeWidth}/${largeHeight}?random=${randomId}`
  } else {
    // Handle URLs without random parameter
    const urlParts = baseUrl.split("?")
    const baseUrlWithoutParams = urlParts[0]
    const params = urlParts.length > 1 ? `?${urlParts[1]}` : ""

    // Replace dimensions in the URL
    const dimensionsRegex = /\/(\d+)\/(\d+)/
    tiny = baseUrlWithoutParams.replace(dimensionsRegex, `/${tinyWidth}/${tinyHeight}`) + params
    small = baseUrlWithoutParams.replace(dimensionsRegex, `/${smallWidth}/${smallHeight}`) + params
    medium = baseUrlWithoutParams.replace(dimensionsRegex, `/${mediumWidth}/${mediumHeight}`) + params
    large = baseUrlWithoutParams.replace(dimensionsRegex, `/${largeWidth}/${largeHeight}`) + params
  }

  return {
    tiny,
    small,
    medium,
    large,
    original: baseUrl,
  }
}

/**
 * Generates the appropriate sizes attribute for responsive images
 * @returns The sizes attribute string
 */
export function getImageSizes(customSizes?: string): string {
  return customSizes || "(max-width: 480px) 100vw, (max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
}

/**
 * Generates a placeholder image URL with the specified dimensions
 * @param width The width of the placeholder image
 * @param height The height of the placeholder image
 * @returns A placeholder image URL
 */
export function getPlaceholderImage(width: number, height: number): string {
  const randomId = Math.floor(Math.random() * 1000)
  return `https://picsum.photos/${width}/${height}?random=${randomId}`
}
