const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Types
export interface Attribute {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface AttributeOption {
  id: string;
  attributeId: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
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

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  price?: number; // API returns 'price' instead of 'unitPrice'
  unitPrice?: number; // For backward compatibility
  subtotal: number;
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: 'CUSTOMER' | 'ADMIN';
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

// Products CRUD
export async function createProduct(productData: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create product' }));
    throw new Error(error.message || 'Failed to create product');
  }
  
  return await response.json();
}

export async function updateProduct(id: string, productData: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(productData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update product' }));
    throw new Error(error.message || 'Failed to update product');
  }
  
  return await response.json();
}

export async function updateProductAttributes(
  productId: string,
  attributes: Array<{ attributeId: string; optionId: string }>
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}/attributes`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ attributes }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update product attributes' }));
    throw new Error(error.message || 'Failed to update product attributes');
  }
  
  return await response.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete product' }));
    throw new Error(error.message || 'Failed to delete product');
  }
}

// Categories CRUD
export async function createCategory(categoryData: { name: string; description?: string; parentCategoryId?: string; slug?: string }): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(categoryData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create category' }));
    throw new Error(error.message || 'Failed to create category');
  }
  
  return await response.json();
}

export async function updateCategory(id: string, categoryData: { name: string; description?: string; parentCategoryId?: string; slug?: string }): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(categoryData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update category' }));
    throw new Error(error.message || 'Failed to update category');
  }
  
  return await response.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete category' }));
    throw new Error(error.message || 'Failed to delete category');
  }
}

export async function fetchCategoriesPaginated(
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<PaginatedResponse<any>> {
  const response = await fetch(
    `${API_BASE_URL}/categories/paginated?page=${page}&size=${size}&sort=${sort}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  
  return await response.json();
}

// Attributes CRUD
export async function createAttribute(attributeData: { name: string; description?: string }): Promise<Attribute> {
  const response = await fetch(`${API_BASE_URL}/attributes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(attributeData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create attribute' }));
    throw new Error(error.message || 'Failed to create attribute');
  }
  
  return await response.json();
}

export async function updateAttribute(id: string, attributeData: { name: string; description?: string; isActive?: boolean }): Promise<Attribute> {
  const response = await fetch(`${API_BASE_URL}/attributes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(attributeData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update attribute' }));
    throw new Error(error.message || 'Failed to update attribute');
  }
  
  return await response.json();
}

export async function deleteAttribute(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/attributes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete attribute' }));
    throw new Error(error.message || 'Failed to delete attribute');
  }
}

export async function fetchAttributesPaginated(
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<PaginatedResponse<Attribute>> {
  const response = await fetch(
    `${API_BASE_URL}/attributes/paginated?page=${page}&size=${size}&sort=${sort}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch attributes');
  }
  
  return await response.json();
}

export async function fetchAttributeOptions(attributeId: string): Promise<AttributeOption[]> {
  const response = await fetch(`${API_BASE_URL}/attributes/${attributeId}/options`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch attribute options');
  }
  
  return await response.json();
}

export async function createAttributeOption(attributeId: string, optionData: { name: string; description?: string }): Promise<AttributeOption> {
  const response = await fetch(`${API_BASE_URL}/attributes/${attributeId}/options`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(optionData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create attribute option' }));
    throw new Error(error.message || 'Failed to create attribute option');
  }
  
  return await response.json();
}

export async function updateAttributeOption(optionId: string, optionData: { name: string; description?: string; isActive?: boolean }): Promise<AttributeOption> {
  const response = await fetch(`${API_BASE_URL}/attributes/options/${optionId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(optionData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update attribute option' }));
    throw new Error(error.message || 'Failed to update attribute option');
  }
  
  return await response.json();
}

export async function deleteAttributeOption(optionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/attributes/options/${optionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete attribute option' }));
    throw new Error(error.message || 'Failed to delete attribute option');
  }
}

// Orders
export async function fetchOrdersPaginated(
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<PaginatedResponse<Order>> {
  const response = await fetch(
    `${API_BASE_URL}/orders/paginated?page=${page}&size=${size}&sort=${sort}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  
  return await response.json();
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update order status' }));
    throw new Error(error.message || 'Failed to update order status');
  }
  
  return await response.json();
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/payment-status?paymentStatus=${paymentStatus}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update payment status' }));
    throw new Error(error.message || 'Failed to update payment status');
  }
  
  return await response.json();
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }
  
  return await response.json();
}

// Users CRUD
export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return await response.json();
}

export async function fetchUsersPaginated(
  page: number = 0,
  size: number = 20,
  sort: string = 'createdAt,desc'
): Promise<PaginatedResponse<User>> {
  const response = await fetch(
    `${API_BASE_URL}/users/paginated?page=${page}&size=${size}&sort=${sort}`,
    {
      credentials: 'include',
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return await response.json();
}

export async function fetchUserById(userId: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  return await response.json();
}

export async function createUser(userData: CreateUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create user' }));
    throw new Error(error.message || 'Failed to create user');
  }
  
  return await response.json();
}

export async function updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user' }));
    throw new Error(error.message || 'Failed to update user');
  }
  
  return await response.json();
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(error.message || 'Failed to delete user');
  }
}

export async function checkUserExists(email: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/users/exists?email=${encodeURIComponent(email)}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to check user existence');
  }
  
  return await response.json();
}

// Product Images / Media - Based on actual API response
export interface FileMetadata {
  publicId: string;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  contentType: string;
  fileType: string;
  createdAt: string;
  downloadUrl: string;
}

export interface ProductImage {
  publicId: string;
  productPublicId: string;
  fileMetadata: FileMetadata | null;
  isPrimary: boolean;
  displayOrder: number;
  altText: string | null;
  imageUrl: string;  // Full URL provided by API
}

export interface UpdateProductImageRequest {
  isPrimary?: boolean;
  displayOrder?: number;
  altText?: string;
}

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch product images');
  }
  
  return await response.json();
}

export async function uploadProductImage(
  productId: string,
  file: File,
  options?: { isPrimary?: boolean; displayOrder?: number; altText?: string }
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.isPrimary !== undefined) {
    formData.append('isPrimary', String(options.isPrimary));
  }
  if (options?.displayOrder !== undefined) {
    formData.append('displayOrder', String(options.displayOrder));
  }
  if (options?.altText) {
    formData.append('altText', options.altText);
  }

  const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upload image' }));
    throw new Error(error.message || 'Failed to upload image');
  }
  
  return await response.json();
}

export async function updateProductImage(
  imageId: string,
  data: UpdateProductImageRequest
): Promise<ProductImage> {
  const response = await fetch(`${API_BASE_URL}/files/images/${imageId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update image' }));
    throw new Error(error.message || 'Failed to update image');
  }
  
  return await response.json();
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/files/images/${imageId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete image' }));
    throw new Error(error.message || 'Failed to delete image');
  }
}

export async function deleteAllProductImages(productId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/files/products/${productId}/images`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete images' }));
    throw new Error(error.message || 'Failed to delete images');
  }
}

