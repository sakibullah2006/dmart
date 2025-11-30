"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  fetchProductBySlug,
  getProductImageUrl,
  type Product,
  type ProductImage,
} from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import {
  ShoppingCart,
  Loader2,
  ArrowLeft,
  Package,
  Tag,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const { addItem, openCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductBySlug(slug);
        if (!data) {
          setError("Product not found");
        } else {
          setProduct(data);
          // Set selected image to primary image if available
          if (data.images && data.images.length > 0) {
            const primaryIndex = data.images.findIndex((img) => img.isPrimary);
            if (primaryIndex >= 0) {
              setSelectedImageIndex(primaryIndex);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) {
      alert("Please login to add items to cart");
      return;
    }

    if (product.stockQuantity === 0) {
      alert("This product is out of stock");
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, quantity);
      openCart();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  const getImageUrl = (image: ProductImage): string => {
    if (image.publicId) {
      return `/api/images/${image.publicId}`;
    }
    if (image.imageUrl) {
      return image.imageUrl;
    }
    return image.fileUrl || "";
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || "The product you're looking for doesn't exist."}
              </p>
              <Button onClick={() => router.push("/shop")} variant="default">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = product.salePrice ?? product.price;
  const hasSale = product.salePrice && product.salePrice < product.price;
  const isOutOfStock = product.stockQuantity === 0;
  const images = product.images || [];
  const primaryImageUrl = images.length > 0 ? getImageUrl(images[selectedImageIndex]) : null;

  // Get attribute name and option name from various possible structures
  const getAttributeDisplay = (attr: any) => {
    if (attr.attribute?.name && attr.attributeOption?.name) {
      return { name: attr.attribute.name, value: attr.attributeOption.name };
    }
    if (attr.attributeName && attr.optionName) {
      return { name: attr.attributeName, value: attr.optionName };
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              {primaryImageUrl ? (
                <Image
                  src={primaryImageUrl}
                  alt={images[selectedImageIndex]?.altText || product.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              {hasSale && (
                <div className="absolute top-4 right-4 rounded-full bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground">
                  Sale
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => {
                  const thumbUrl = getImageUrl(image);
                  return (
                    <button
                      key={image.publicId || index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md border-2 transition-all",
                        selectedImageIndex === index
                          ? "border-primary"
                          : "border-transparent hover:border-primary/50"
                      )}
                    >
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt={image.altText || `${product.name} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
              {product.shortDescription && (
                <p className="text-lg text-muted-foreground">{product.shortDescription}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">
                ${displayPrice.toFixed(2)}
              </span>
              {hasSale && (
                <span className="text-xl text-muted-foreground line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive font-medium">Out of Stock</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">
                    {product.stockQuantity} in stock
                  </span>
                </>
              )}
            </div>

            {/* SKU */}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">SKU:</span> {product.sku}
            </div>

            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/shop?categories=${category.id}`}
                      className="text-sm px-3 py-1 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Specifications</h3>
                <div className="space-y-2">
                  {product.attributes.map((attr, index) => {
                    const display = getAttributeDisplay(attr);
                    if (!display) return null;
                    return (
                      <div key={index} className="flex gap-2 text-sm">
                        <span className="font-medium text-muted-foreground min-w-[100px]">
                          {display.name}:
                        </span>
                        <span>{display.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <Label htmlFor="quantity" className="font-medium">
                  Quantity:
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(product.stockQuantity, parseInt(e.target.value) || 1));
                      setQuantity(val);
                    }}
                    className="w-16 text-center border rounded-md px-2 py-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stockQuantity}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={isOutOfStock || adding}
                onClick={handleAddToCart}
              >
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

