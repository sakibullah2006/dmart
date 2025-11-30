"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchProductPrimaryImageUrl, CartItem } from "@/lib/api";

// Separate component for sidebar cart item to properly use hooks
function SidebarCartItem({ 
  item, 
  onQuantityChange, 
  onRemove, 
  loading 
}: { 
  item: CartItem; 
  onQuantityChange: (itemId: string, currentQuantity: number, delta: number) => void;
  onRemove: (itemId: string) => void;
  loading: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadImage = async () => {
      const url = await fetchProductPrimaryImageUrl(item.product.id);
      if (url) {
        // Extract publicId from imageUrl (e.g., "http://localhost:8080/api/files/images/{publicId}")
        // and use the Next.js proxy route to avoid CORS
        const publicIdMatch = url.match(/\/images\/([^\/]+)$/);
        if (publicIdMatch && publicIdMatch[1]) {
          setImageUrl(`/api/images/${publicIdMatch[1]}`);
        } else {
          // Fallback: try to extract from end of URL
          const publicId = url.split('/').pop();
          if (publicId) {
            setImageUrl(`/api/images/${publicId}`);
          }
        }
      }
    };
    loadImage();
  }, [item.product.id]);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-20 h-20 rounded bg-secondary/30 flex-shrink-0 relative overflow-hidden">
            {imageError || !imageUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <Image
                src={imageUrl}
                alt={item.product.name}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground truncate">
              {item.product.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              SKU: {item.product.sku}
            </p>
            <p className="text-sm font-semibold text-primary mt-2">
              ${item.currentPrice.toFixed(2)}
            </p>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onQuantityChange(item.id, item.quantity, -1)}
                disabled={loading}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-8 text-center">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onQuantityChange(item.id, item.quantity, 1)}
                disabled={loading}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-auto"
                onClick={() => onRemove(item.id)}
                disabled={loading}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Subtotal */}
            <p className="text-sm font-medium text-foreground mt-2">
              Subtotal: ${(item.subtotal || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CartSidebar() {
  const { cart, loading, error, isOpen, closeCart, fetchCart, updateItem, removeItem, clear } =
    useCartStore();

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  const handleQuantityChange = async (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      await updateItem(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId: string) => {
    await removeItem(itemId);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear your cart?")) {
      await clear();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </h2>
              <Button variant="ghost" size="icon" onClick={closeCart}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {loading && !cart ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button variant="outline" onClick={fetchCart}>
                    Retry
                  </Button>
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="p-6 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Your cart is empty</p>
                  <Button onClick={closeCart} asChild>
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cart.items.map((item) => (
                    <SidebarCartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      loading={loading}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-border p-4 space-y-4 bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Total Items:</span>
                  <span className="text-sm font-semibold text-foreground">{cart.totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-foreground">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    ${cart.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleClear} disabled={loading}>
                    Clear Cart
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/cart" onClick={closeCart}>
                      View Cart
                    </Link>
                  </Button>
                </div>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/checkout" onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

