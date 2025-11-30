"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { Product, getProductImageUrl } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const imageUrl = getProductImageUrl(product);
  const displayPrice = product.salePrice ?? product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stockQuantity === 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert("Please login to add items to cart");
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    try {
      await addItem(product.id, 1);
      openCart(); // Open cart sidebar after adding
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.images?.[0]?.altText || product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
              <span className="text-4xl text-muted-foreground">📦</span>
            </div>
          )}
          {hasSale && (
            <div className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-semibold text-destructive-foreground">
              Sale
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="pb-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-card-foreground line-clamp-2 hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.shortDescription}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              ${displayPrice.toFixed(2)}
            </span>
            {hasSale && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : "Out of stock"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          className="w-full"
          variant="default"
          disabled={isOutOfStock || adding}
          onClick={handleAddToCart}
        >
          {adding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

