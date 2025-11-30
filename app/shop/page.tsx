"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  searchProducts,
  fetchCategories,
  type Product,
  type Category,
  type ProductSearchParams,
} from "@/lib/api";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef } from "react";

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined
  );
  const [inStock, setInStock] = useState(
    searchParams.get("inStock") === "true" ? true : undefined
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "name,asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "0")
  );
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Sync state with URL parameters when they change
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    const newCategories = categoriesParam?.split(",").filter(Boolean) || [];
    
    // Only update if categories actually changed to avoid infinite loops
    if (JSON.stringify(newCategories) !== JSON.stringify(selectedCategories)) {
      setSelectedCategories(newCategories);
      setCurrentPage(0); // Reset to first page when filter changes
    }

    const searchParam = searchParams.get("search") || "";
    if (searchParam !== searchTerm) {
      setSearchTerm(searchParam);
    }

    const minPriceParam = searchParams.get("minPrice");
    const newMinPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    if (newMinPrice !== minPrice) {
      setMinPrice(newMinPrice);
    }

    const maxPriceParam = searchParams.get("maxPrice");
    const newMaxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
    if (newMaxPrice !== maxPrice) {
      setMaxPrice(newMaxPrice);
    }

    const inStockParam = searchParams.get("inStock");
    const newInStock = inStockParam === "true" ? true : undefined;
    if (newInStock !== inStock) {
      setInStock(newInStock);
    }

    const sortParam = searchParams.get("sort") || "name,asc";
    if (sortParam !== sort) {
      setSort(sortParam);
    }

    const pageParam = parseInt(searchParams.get("page") || "0");
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam);
    }
  }, [searchParams]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    }
    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryDropdown]);

  // Sync state with URL parameters when they change (e.g., from header navigation)
  useEffect(() => {
    const categoriesParam = searchParams.get("categories");
    const newCategories = categoriesParam?.split(",").filter(Boolean) || [];
    
    // Only update if categories actually changed
    if (JSON.stringify(newCategories.sort()) !== JSON.stringify(selectedCategories.sort())) {
      setSelectedCategories(newCategories);
      setCurrentPage(0);
    }

    const searchParam = searchParams.get("search") || "";
    if (searchParam !== searchTerm) {
      setSearchTerm(searchParam);
    }

    const minPriceParam = searchParams.get("minPrice");
    const newMinPrice = minPriceParam ? parseFloat(minPriceParam) : undefined;
    if (newMinPrice !== minPrice) {
      setMinPrice(newMinPrice);
    }

    const maxPriceParam = searchParams.get("maxPrice");
    const newMaxPrice = maxPriceParam ? parseFloat(maxPriceParam) : undefined;
    if (newMaxPrice !== maxPrice) {
      setMaxPrice(newMaxPrice);
    }

    const inStockParam = searchParams.get("inStock");
    const newInStock = inStockParam === "true" ? true : undefined;
    if (newInStock !== inStock) {
      setInStock(newInStock);
    }

    const sortParam = searchParams.get("sort") || "name,asc";
    if (sortParam !== sort) {
      setSort(sortParam);
    }

    const pageParam = parseInt(searchParams.get("page") || "0");
    if (pageParam !== currentPage) {
      setCurrentPage(pageParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load products when filters or page changes
  useEffect(() => {
    loadProducts();
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, selectedCategories, minPrice, maxPrice, inStock, sort]);

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: ProductSearchParams = {
        searchTerm: searchTerm || undefined,
        categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        minPrice: minPrice,
        maxPrice: maxPrice,
        inStock: inStock,
        page: currentPage,
        size: pageSize,
        sort: sort,
      };

      const response = await searchProducts(params);
      setProducts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategories.length > 0) params.set("categories", selectedCategories.join(","));
    if (minPrice !== undefined) params.set("minPrice", minPrice.toString());
    if (maxPrice !== undefined) params.set("maxPrice", maxPrice.toString());
    if (inStock !== undefined) params.set("inStock", inStock.toString());
    if (sort !== "name,asc") params.set("sort", sort);
    if (currentPage > 0) params.set("page", currentPage.toString());

    router.replace(`/shop?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      setCurrentPage(0);
      return newCategories;
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStock(undefined);
    setSort("name,asc");
    setCurrentPage(0);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategories.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStock !== undefined ||
    sort !== "name,asc";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Shop</h1>
          <p className="text-muted-foreground">
            {totalElements} product{totalElements !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="button" variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                  {[
                    searchTerm && "1",
                    selectedCategories.length > 0 && selectedCategories.length.toString(),
                    (minPrice !== undefined || maxPrice !== undefined) && "1",
                    inStock !== undefined && "1",
                  ]
                    .filter(Boolean)
                    .reduce((a, b) => (parseInt(a || "0") + parseInt(b || "0")).toString(), "0")}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </form>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Categories Dropdown */}
                    <div ref={categoryDropdownRef} className="relative">
                      <Label className="text-sm font-medium mb-3 block">Categories</Label>
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="w-full flex items-center justify-between p-3 border border-input rounded-md bg-background hover:bg-secondary/50 transition-colors text-left"
                      >
                        <span className="text-sm">
                          {selectedCategories.length === 0
                            ? "Select categories..."
                            : selectedCategories.length === 1
                            ? categories.find((c) => c.id === selectedCategories[0])?.name ||
                              "1 category selected"
                            : `${selectedCategories.length} categories selected`}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            showCategoryDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {showCategoryDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                          >
                            {categories.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No categories available
                              </div>
                            ) : (
                              categories.map((category) => {
                                const isSelected = selectedCategories.includes(category.id);
                                return (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => toggleCategory(category.id)}
                                    className={`w-full flex items-center gap-2 p-3 text-left hover:bg-secondary/50 transition-colors ${
                                      isSelected ? "bg-primary/10" : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                        isSelected
                                          ? "bg-primary border-primary"
                                          : "border-muted-foreground"
                                      }`}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                      )}
                                    </div>
                                    <span className="text-sm">{category.name}</span>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCategories.map((categoryId) => {
                            const category = categories.find((c) => c.id === categoryId);
                            if (!category) return null;
                            return (
                              <span
                                key={categoryId}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                              >
                                {category.name}
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(categoryId)}
                                  className="hover:bg-primary/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Price Range */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Price Range</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
                            Min Price ($)
                          </Label>
                          <Input
                            id="minPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={minPrice || ""}
                            onChange={(e) =>
                              setMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">
                            Max Price ($)
                          </Label>
                          <Input
                            id="maxPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            value={maxPrice || ""}
                            onChange={(e) =>
                              setMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                            placeholder="9999.99"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Availability</Label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inStock === true}
                          onChange={(e) => setInStock(e.target.checked ? true : undefined)}
                          className="rounded border-input"
                        />
                        <span className="text-sm">In Stock Only</span>
                      </label>
                    </div>

                    {/* Sort */}
                    <div>
                      <Label htmlFor="sort" className="text-sm font-medium mb-3 block">
                        Sort By
                      </Label>
                      <select
                        id="sort"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="name,asc">Name (A-Z)</option>
                        <option value="name,desc">Name (Z-A)</option>
                        <option value="price,asc">Price (Low to High)</option>
                        <option value="price,desc">Price (High to Low)</option>
                        <option value="createdAt,desc">Newest First</option>
                        <option value="createdAt,asc">Oldest First</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-2">No products found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {currentPage * pageSize + 1} to{" "}
                  {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}{" "}
                  products
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1 || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

