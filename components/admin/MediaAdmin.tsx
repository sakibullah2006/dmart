"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProducts, type Product } from "@/lib/api";
import {
  fetchProductImages,
  uploadProductImage,
  updateProductImage,
  deleteProductImage,
  type ProductImage,
} from "@/lib/adminApi";
import {
  Upload,
  Trash2,
  Search,
  Image as ImageIcon,
  Star,
  Edit,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Proxy image URL through Next.js API to avoid CORS issues
function getProxyImageUrl(publicId: string): string {
  return `/api/images/${publicId}`;
}

export function MediaAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [editFormData, setEditFormData] = useState({
    altText: "",
    displayOrder: 0,
    isPrimary: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadImages(selectedProduct.id);
    } else {
      setImages([]);
    }
  }, [selectedProduct]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetchProducts(0, 100);
      setProducts(response.content);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async (productId: string) => {
    try {
      setLoadingImages(true);
      const productImages = await fetchProductImages(productId);
      setImages(productImages);
    } catch (error) {
      console.error("Failed to load images:", error);
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedProduct || !e.target.files?.length) return;

    const files = Array.from(e.target.files);
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isPrimary = images.length === 0 && i === 0;
        await uploadProductImage(selectedProduct.id, file, {
          isPrimary,
          displayOrder: images.length + i,
        });
      }
      await loadImages(selectedProduct.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await deleteProductImage(imageId);
      if (selectedProduct) {
        await loadImages(selectedProduct.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete image");
    }
  };

  const handleSetPrimary = async (image: ProductImage) => {
    try {
      await updateProductImage(image.publicId, { isPrimary: true });
      if (selectedProduct) {
        await loadImages(selectedProduct.id);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to set primary image");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    try {
      await updateProductImage(editingImage.publicId, {
        altText: editFormData.altText || undefined,
        displayOrder: editFormData.displayOrder,
        isPrimary: editFormData.isPrimary,
      });
      if (selectedProduct) {
        await loadImages(selectedProduct.id);
      }
      setEditingImage(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update image");
    }
  };

  const openEditModal = (image: ProductImage) => {
    setEditingImage(image);
    setEditFormData({
      altText: image.altText || "",
      displayOrder: image.displayOrder,
      isPrimary: image.isPrimary,
    });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Media Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage product images and media files
          </p>
        </div>
      </div>

      {/* Product Selector */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-2 block">Select a Product</Label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 border border-input rounded-md bg-background hover:bg-secondary/50 transition-colors text-left"
              onClick={() => setShowProductDropdown(!showProductDropdown)}
            >
              {selectedProduct ? (
                <div>
                  <span className="font-medium">{selectedProduct.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({selectedProduct.sku})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">Choose a product to manage images...</span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showProductDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showProductDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-80 overflow-hidden"
                >
                  <div className="p-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className={`w-full p-3 text-left hover:bg-secondary/50 transition-colors flex items-center gap-3 ${
                            selectedProduct?.id === product.id ? "bg-primary/10" : ""
                          }`}
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductDropdown(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="w-10 h-10 rounded bg-secondary/50 flex items-center justify-center overflow-hidden">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.sku}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Images Section */}
      {selectedProduct && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Images for {selectedProduct.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {images.length} image{images.length !== 1 ? "s" : ""} • Click to upload
              </p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingImages ? (
              <div className="text-center py-8 text-muted-foreground">Loading images...</div>
            ) : images.length === 0 ? (
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No images yet</p>
                <p className="text-sm text-muted-foreground">
                  Click here or use the button above to upload images
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((image) => (
                    <motion.div
                      key={image.publicId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30"
                    >
                      {/* Use proxy URL to avoid CORS issues */}
                        <img
                          src={getProxyImageUrl(image.publicId)}
                          alt={image.altText || "Product image"}
                          className="w-full h-full object-cover"
                        />

                      {/* Primary Badge */}
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </div>
                      )}

                      {/* Order Badge */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        #{image.displayOrder}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.isPrimary && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetPrimary(image)}
                            title="Set as primary"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditModal(image)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(image.publicId)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Alt Text Preview */}
                      {image.altText && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                          {image.altText}
                        </div>
                      )}
                    </motion.div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setEditingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Edit Image</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden bg-secondary/30">
                  <img
                    src={getProxyImageUrl(editingImage.publicId)}
                    alt={editingImage.altText || ""}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <Label htmlFor="altText">Alt Text</Label>
                  <Input
                    id="altText"
                    value={editFormData.altText}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, altText: e.target.value })
                    }
                    placeholder="Describe the image for accessibility"
                  />
                </div>

                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min="0"
                    value={editFormData.displayOrder}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isPrimary}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, isPrimary: e.target.checked })
                      }
                      className="rounded border-input"
                    />
                    <span className="text-sm">Set as primary image</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingImage(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Product Selected State */}
      {!selectedProduct && (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Product Selected</h3>
          <p className="text-muted-foreground">
            Select a product from the dropdown above to manage its images
          </p>
        </div>
      )}
    </div>
  );
}

