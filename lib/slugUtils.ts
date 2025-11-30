/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^\w\-]+/g, '')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a slug for a product from name and optionally SKU
 * @param name - Product name
 * @param sku - Product SKU (optional)
 * @returns A URL-friendly slug
 */
export function generateProductSlug(name: string, sku?: string): string {
  if (sku) {
    // Combine name and SKU: "Product Name SKU123" -> "product-name-sku123"
    return generateSlug(`${name} ${sku}`);
  }
  return generateSlug(name);
}

