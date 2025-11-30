"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/store/cartStore";
import { Plus, Minus, Trash2, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchProductPrimaryImageUrl, CartItem } from "@/lib/api";

// Separate component for cart item to properly use hooks
function CartItemCard({ 
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="w-24 h-24 rounded-lg bg-secondary/30 flex-shrink-0 relative overflow-hidden">
              {imageError || !imageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
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
              <h3 className="font-semibold text-lg text-foreground">{item.product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                SKU: {item.product.sku}
              </p>
              <p className="text-lg font-semibold text-primary mt-2">
                ${item.currentPrice.toFixed(2)}
              </p>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm font-medium text-foreground">Quantity:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onQuantityChange(item.id, item.quantity, -1)}
                    disabled={loading}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-base font-medium w-10 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onQuantityChange(item.id, item.quantity, 1)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive ml-auto"
                  onClick={() => onRemove(item.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>

              {/* Subtotal */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${(item.subtotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CartPage() {
  const { cart, loading, error, fetchCart, updateItem, removeItem, clear } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (itemId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      await updateItem(itemId, newQuantity);
    }
  };

  const handleRemove = async (itemId: string) => {
    if (confirm("Remove this item from your cart?")) {
      await removeItem(itemId);
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear your cart? This action cannot be undone.")) {
      await clear();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
        </div>

        {loading && !cart ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={fetchCart}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : !cart || cart.items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"}
                </h2>
                <Button variant="outline" size="sm" onClick={handleClear} disabled={loading}>
                  Clear Cart
                </Button>
              </div>

              {cart.items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  loading={loading}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal ({cart.totalItems} items):</span>
                      <span className="text-foreground">${cart.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping:</span>
                      <span className="text-foreground">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax:</span>
                      <span className="text-foreground">Calculated at checkout</span>
                    </div>
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-foreground">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${cart.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/shop">Continue Shopping</Link>
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      Secure checkout • Free returns • 30-day guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

