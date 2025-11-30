import { create } from "zustand";
import { Cart, CartItem, fetchCart, addToCart, updateCartItem, removeFromCart, clearCart } from "@/lib/api";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clear: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  error: null,
  isOpen: false,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await fetchCart();
      set({ cart, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load cart";
      set({ error: errorMessage, loading: false, cart: null });
    }
  },

  addItem: async (productId: string, quantity: number = 1) => {
    set({ loading: true, error: null });
    try {
      const cart = await addToCart(productId, quantity);
      set({ cart, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  updateItem: async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await get().removeItem(cartItemId);
      return;
    }

    set({ loading: true, error: null });
    try {
      const cart = await updateCartItem(cartItemId, quantity);
      set({ cart, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update cart item";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  removeItem: async (cartItemId: string) => {
    set({ loading: true, error: null });
    try {
      const cart = await removeFromCart(cartItemId);
      set({ cart, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove item from cart";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  clear: async () => {
    set({ loading: true, error: null });
    try {
      await clearCart();
      set({ cart: null, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear cart";
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
}));

