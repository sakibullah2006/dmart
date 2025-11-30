const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ProductImage {
  publicId: string;
  fileName?: string;
  fileUrl?: string;
  imageUrl?: string;  // API returns this field
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

// Product attribute as returned from API (GET response)
export interface ProductAttributeResponse {
  attribute?: {
    publicId?: string;
    id?: string;
    name?: string;
  };
  attributeOption?: {
    publicId?: string;
    id?: string;
    name?: string;
  };
  // Alternative flat structure
  attributeId?: string;
  attributeName?: string;
  optionId?: string;
  optionName?: string;
  // Request structure format
  options?: Array<{
    optionId?: string;
    id?: string;
  }>;
}

// Product attribute for API requests (POST/PUT)
export interface ProductAttributeRequest {
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
  attributes?: ProductAttributeResponse[];
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
 * Uses the Next.js proxy route to avoid CORS issues
 */
export function getProductImageUrl(product: Product): string | null {
  if (!product.images || product.images.length === 0) {
    return null;
  }
  
  // Find primary image, or use first image
  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  
  // Use the Next.js proxy route to avoid CORS issues
  return `/api/images/${primaryImage.publicId}`;
}

/**
 * Get the primary image URL for a product by product ID
 * Uses the Next.js proxy route to avoid CORS issues
 */
export function getProductImageUrlById(productId: string): string {
  return `/api/files/products/${productId}/images/primary`;
}

/**
 * Fetch the primary product image and return the imageUrl from the API response
 */
export async function fetchProductPrimaryImageUrl(productId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images/primary`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error('Error fetching product primary image:', error);
    return null;
  }
}

/**
 * Fetch all product images and return the primary image URL, or first image if no primary
 */
export async function getProductPrimaryImageUrl(productId: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const images = await response.json();
    if (!images || images.length === 0) {
      return null;
    }
    
    // Find primary image, or use first image
    const primaryImage = images.find((img: any) => img.isPrimary) || images[0];
    
    if (primaryImage?.publicId) {
      return `/api/images/${primaryImage.publicId}`;
    }
    
    if (primaryImage?.imageUrl) {
      // If imageUrl is a full URL, we need to proxy it
      return `/api/products/${productId}/images/primary`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching product images:', error);
    return null;
  }
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

export interface ProductSearchParams {
  searchTerm?: string;
  categoryIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export async function searchProducts(
  params: ProductSearchParams = {}
): Promise<PaginatedResponse<Product>> {
  try {
    const {
      searchTerm,
      categoryIds = [],
      minPrice,
      maxPrice,
      inStock,
      page = 0,
      size = 20,
      sort = 'name,asc',
    } = params;

    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('searchTerm', searchTerm);
    if (categoryIds.length > 0) {
      categoryIds.forEach((id) => queryParams.append('categoryIds', id));
    }
    if (minPrice !== undefined) queryParams.append('minPrice', minPrice.toString());
    if (maxPrice !== undefined) queryParams.append('maxPrice', maxPrice.toString());
    if (inStock !== undefined) queryParams.append('inStock', inStock.toString());
    queryParams.append('page', page.toString());
    queryParams.append('size', size.toString());
    queryParams.append('sort', sort);

    const response = await fetch(
      `${API_BASE_URL}/products/search?${queryParams.toString()}`,
      {
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to search products');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching products:', error);
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

// Cart API
export interface CartItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    stockQuantity: number;
  };
  quantity: number;
  priceAtAddition: number;
  currentPrice: number;
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: string;
  userId?: string;
  items: CartItem[];
  totalPrice: number;
  totalItems: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchCart(): Promise<Cart> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      credentials: 'include',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please login to view your cart');
      }
      throw new Error('Failed to fetch cart');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
}

export async function addToCart(productId: string, quantity: number = 1): Promise<Cart> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ productId, quantity }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to add item to cart' }));
      throw new Error(error.message || 'Failed to add item to cart');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<Cart> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update cart item' }));
      throw new Error(error.message || 'Failed to update cart item');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
}

export async function removeFromCart(cartItemId: string): Promise<Cart> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/items/${cartItemId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to remove item from cart' }));
      throw new Error(error.message || 'Failed to remove item from cart');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
}

export async function clearCart(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to clear cart' }));
      throw new Error(error.message || 'Failed to clear cart');
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

// Order API
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  price?: number; // API returns 'price' instead of 'unitPrice'
  unitPrice?: number; // For backward compatibility
  subtotal?: number;
}

export interface Payment {
  id: string;
  orderId?: string;
  paymentMethod?: string;
  method?: string; // For backward compatibility
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'; // For backward compatibility
  amount: number;
  transactionId?: string;
  cardLastFour?: string;
  cardBrand?: string;
  paymentGateway?: string;
  paymentDate?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  items: OrderItem[];
  payment?: Payment;
  customerEmail: string;
  customerPhone?: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export async function fetchMyOrders(
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<PaginatedResponse<Order>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/orders/my-orders/paginated?page=${page}&size=${size}&sort=${sort}`,
      {
        credentials: 'include',
        cache: 'no-store',
      }
    );
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please login to view your orders');
      }
      throw new Error('Failed to fetch orders');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderRequest {
  shippingAddress: Address;
  billingAddress: Address;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY';
}

export interface ProcessPaymentRequest {
  paymentDetails: {
    cardNumber: string;
    cardHolderName: string;
    expiryDate: string; // Format: "MM/YYYY" or "YYYY-MM"
    cvv: string;
  };
}

export async function createOrder(request: CreateOrderRequest): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create order' }));
      throw new Error(error.detail || error.message || 'Failed to create order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

export async function processPayment(orderId: string, request: ProcessPaymentRequest): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Payment failed' }));
      throw new Error(error.detail || error.message || 'Payment failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Order not found');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized to view this order');
      }
      throw new Error('Failed to fetch order');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

