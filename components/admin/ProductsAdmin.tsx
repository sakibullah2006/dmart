"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchProducts, fetchCategories, type Product, type Category } from "@/lib/api";
import {
  createProduct,
  updateProduct,
  updateProductAttributes,
  deleteProduct,
  fetchAttributesPaginated,
  fetchAttributeOptions,
  type Attribute,
  type AttributeOption,
} from "@/lib/adminApi";
import { Plus, Edit, Trash2, Search, ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateProductSlug } from "@/lib/slugUtils";

// Get proxy image URL to avoid CORS issues
function getProxyImageUrl(publicId: string): string {
  return `/api/images/${publicId}`;
}

// Type for attribute with loaded options
interface AttributeWithOptions extends Attribute {
  options: AttributeOption[];
}

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Categories and attributes state
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<AttributeWithOptions[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Expanded sections in form
  const [showCategories, setShowCategories] = useState(false);
  const [showAttributes, setShowAttributes] = useState(false);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    price: "",
    salePrice: "",
    stockQuantity: "",
    categoryIds: [] as string[],
    // attributeSelections maps attributeId -> optionId (one option per attribute)
    attributeSelections: {} as Record<string, string>,
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    loadProducts();
    loadMetadata();
  }, []);

  // Auto-generate slug from name and SKU when creating (not editing)
  useEffect(() => {
    if (!editingProduct && !slugManuallyEdited && formData.name) {
      const autoSlug = generateProductSlug(formData.name, formData.sku || undefined);
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.name, formData.sku, editingProduct, slugManuallyEdited]);

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

  const loadMetadata = async () => {
    try {
      setLoadingMeta(true);
      // Load categories and attributes in parallel
      const [categoriesData, attributesResponse] = await Promise.all([
        fetchCategories(),
        fetchAttributesPaginated(0, 100),
      ]);

      setCategories(categoriesData);

      // Load options for each attribute
      const attributesWithOptions: AttributeWithOptions[] = await Promise.all(
        attributesResponse.content.map(async (attr) => {
          const options = await fetchAttributeOptions(attr.id);
          return { ...attr, options };
        })
      );

      setAttributes(attributesWithOptions);
    } catch (error) {
      console.error("Failed to load metadata:", error);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate slug if empty (fallback)
      let finalSlug = formData.slug;
      if (!finalSlug && formData.name) {
        finalSlug = generateProductSlug(formData.name, formData.sku || undefined);
      }

      // Build attributes array from selections (only include attributes with selected options)
      const attributesForCreate = Object.entries(formData.attributeSelections)
        .filter(([, optionId]) => optionId) // Only include if an option is selected
        .map(([attributeId, optionId]) => ({
          attributeId,
          options: [{ optionId }],
        }));

      // For PUT /products/{id}/attributes endpoint (flat structure)
      const attributesForUpdate = Object.entries(formData.attributeSelections)
        .filter(([, optionId]) => optionId)
        .map(([attributeId, optionId]) => ({
          attributeId,
          optionId,
        }));

      if (editingProduct) {
        // Update product WITHOUT attributes (to avoid duplicate constraint)
        const productPayload = {
          sku: formData.sku,
          name: formData.name,
          slug: finalSlug || undefined,
          shortDescription: formData.shortDescription,
          description: formData.description,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          stockQuantity: parseInt(formData.stockQuantity),
          categoryIds: formData.categoryIds,
        };
        await updateProduct(editingProduct.id, productPayload);

        // Update attributes separately using the dedicated endpoint
        if (attributesForUpdate.length > 0) {
          await updateProductAttributes(editingProduct.id, attributesForUpdate);
        }
      } else {
        // Create product WITH attributes
        const productPayload = {
          sku: formData.sku,
          name: formData.name,
          slug: finalSlug || undefined,
          shortDescription: formData.shortDescription,
          description: formData.description,
          price: parseFloat(formData.price),
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          stockQuantity: parseInt(formData.stockQuantity),
          categoryIds: formData.categoryIds,
          attributes: attributesForCreate,
        };
        await createProduct(productPayload);
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);

    // Build attribute selections from product attributes
    // Handle multiple possible API response formats
    const attributeSelections: Record<string, string> = {};
    product.attributes?.forEach((attr) => {
      // Try to extract attributeId from various possible formats
      const attrId =
        attr.attributeId ||
        attr.attribute?.publicId ||
        attr.attribute?.id;

      // Try to extract optionId from various possible formats
      const optId =
        attr.optionId ||
        attr.attributeOption?.publicId ||
        attr.attributeOption?.id ||
        attr.options?.[0]?.optionId ||
        attr.options?.[0]?.id;

      if (attrId && optId) {
        attributeSelections[attrId] = optId;
      }
    });

    setFormData({
      sku: product.sku,
      name: product.name,
      slug: product.slug || "",
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      price: product.price.toString(),
      salePrice: product.salePrice?.toString() || "",
      stockQuantity: product.stockQuantity.toString(),
      categoryIds: product.categories?.map((c) => c.id) || [],
      attributeSelections,
    });
    setSlugManuallyEdited(true); // When editing, don't auto-generate slug
    setShowCategories(true);
    setShowAttributes(true);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      price: "",
      salePrice: "",
      stockQuantity: "",
      categoryIds: [],
      attributeSelections: {},
    });
    setSlugManuallyEdited(false);
    setEditingProduct(null);
    setShowForm(false);
    setShowCategories(false);
    setShowAttributes(false);
  };

  // Category toggle handler
  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  // Attribute option select handler
  const selectAttributeOption = (attributeId: string, optionId: string) => {
    setFormData((prev) => ({
      ...prev,
      attributeSelections: {
        ...prev.attributeSelections,
        [attributeId]: prev.attributeSelections[attributeId] === optionId ? "" : optionId,
      },
    }));
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
        <h2 className="text-2xl font-bold text-foreground">Products</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{editingProduct ? "Edit Product" : "Create Product"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData({ ...formData, slug: e.target.value });
                      }}
                      placeholder="Auto-generated from name and SKU"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Input
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(value) => setFormData({ ...formData, description: value })}
                      placeholder="Enter product description with formatting..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="salePrice">Sale Price</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        value={formData.salePrice}
                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="border border-border rounded-md">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                      onClick={() => setShowCategories(!showCategories)}
                    >
                      <span className="font-medium text-sm">
                        Categories
                        {formData.categoryIds.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({formData.categoryIds.length} selected)
                          </span>
                        )}
                      </span>
                      {showCategories ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <AnimatePresence>
                      {showCategories && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 border-t border-border">
                            {loadingMeta ? (
                              <p className="text-sm text-muted-foreground">Loading categories...</p>
                            ) : categories.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No categories available</p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categories.map((category) => (
                                  <label
                                    key={category.id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                      formData.categoryIds.includes(category.id)
                                        ? "bg-primary/10 border border-primary"
                                        : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.categoryIds.includes(category.id)}
                                      onChange={() => toggleCategory(category.id)}
                                      className="sr-only"
                                    />
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        formData.categoryIds.includes(category.id)
                                          ? "bg-primary border-primary"
                                          : "border-muted-foreground"
                                      }`}
                                    >
                                      {formData.categoryIds.includes(category.id) && (
                                        <svg
                                          className="w-3 h-3 text-primary-foreground"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-sm">{category.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Attributes Section */}
                  <div className="border border-border rounded-md">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors"
                      onClick={() => setShowAttributes(!showAttributes)}
                    >
                      <span className="font-medium text-sm">
                        Attributes
                        {Object.values(formData.attributeSelections).filter(Boolean).length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({Object.values(formData.attributeSelections).filter(Boolean).length} selected)
                          </span>
                        )}
                      </span>
                      {showAttributes ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <AnimatePresence>
                      {showAttributes && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 border-t border-border space-y-4">
                            {loadingMeta ? (
                              <p className="text-sm text-muted-foreground">Loading attributes...</p>
                            ) : attributes.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No attributes available</p>
                            ) : (
                              attributes.map((attribute) => (
                                <div key={attribute.id} className="space-y-2">
                                  <Label className="text-sm font-medium">{attribute.name}</Label>
                                  {attribute.options.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No options available</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {attribute.options.map((option) => (
                                        <button
                                          key={option.id}
                                          type="button"
                                          onClick={() => selectAttributeOption(attribute.id, option.id)}
                                          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                            formData.attributeSelections[attribute.id] === option.id
                                              ? "bg-primary text-primary-foreground border-primary"
                                              : "bg-secondary/30 hover:bg-secondary/50 border-border"
                                          }`}
                                        >
                                          {option.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            layout
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getProxyImageUrl(
                          (product.images.find((img) => img.isPrimary) || product.images[0])
                            .publicId
                        )}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {product.shortDescription}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm font-medium text-foreground">
                        ${product.price}
                      </span>
                      {product.salePrice && (
                        <span className="text-sm text-primary">
                          Sale: ${product.salePrice}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Stock: {product.stockQuantity}
                      </span>
                    </div>
                    {/* Categories */}
                    {product.categories && product.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="text-xs px-2 py-0.5 bg-secondary/50 rounded-full"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Attributes */}
                    {product.attributes && product.attributes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.attributes.map((attr, idx) => {
                          // Extract IDs from various possible formats
                          const attrId =
                            attr.attributeId ||
                            attr.attribute?.publicId ||
                            attr.attribute?.id;
                          const optId =
                            attr.optionId ||
                            attr.attributeOption?.publicId ||
                            attr.attributeOption?.id ||
                            attr.options?.[0]?.optionId ||
                            attr.options?.[0]?.id;

                          // Get names - first try from response, then from loaded metadata
                          const attrMeta = attributes.find((a) => a.id === attrId);
                          const optionMeta = attrMeta?.options.find((o) => o.id === optId);

                          const attrName =
                            attr.attributeName || attr.attribute?.name || attrMeta?.name || "Attr";
                          const optionName =
                            attr.optionName ||
                            attr.attributeOption?.name ||
                            optionMeta?.name ||
                            "Option";

                          return (
                            <span
                              key={attrId || idx}
                              className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                            >
                              {attrName}: {optionName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No products found
        </div>
      )}
    </div>
  );
}

