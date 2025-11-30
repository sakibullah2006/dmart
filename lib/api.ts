const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ProductImage {
  publicId: string;
  fileName: string;
  fileUrl: string;
  isPrimary: boolean;
  displayOrder: number;
  altText?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  parentCategoryId?: string;
}

export interface ProductAttribute {
  attributeId: string;
  options: Array<{
    optionId: string;
  }>;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  categories?: Category[];
  attributes?: ProductAttribute[];
  images?: ProductImage[];
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * Get the primary image URL for a product, or the first image if no primary is set
 */
export function getProductImageUrl(product: Product): string | null {
  if (!product.images || product.images.length === 0) {
    return null;
  }
  
  // Find primary image, or use first image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  if (primaryImage.fileUrl.startsWith('http')) {
    return primaryImage.fileUrl;
  }
  
  // If fileUrl is relative, construct full URL
  if (primaryImage.fileUrl.startsWith('/')) {
    return `${API_BASE_URL}${primaryImage.fileUrl}`;
  }
  
  // Otherwise, use the image ID endpoint
  return `${API_BASE_URL}/files/images/${primaryImage.publicId}`;
}

export async function fetchProducts(
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<PaginatedResponse<Product>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/products/paginated?page=${page}&size=${size}&sort=${sort}`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      content: [],
      page: 0,
      size: 0,
      totalElements: 0,
      totalPages: 0,
    };
  }
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    // Fetch first page of products sorted by name (you can customize this)
    const response = await fetch(
      `${API_BASE_URL}/products/paginated?page=0&size=8&sort=name,asc`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data: PaginatedResponse<Product> = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch category');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/categories/slug/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch category');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

