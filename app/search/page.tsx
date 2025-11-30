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

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Get search query from URL
  const searchQuery = searchParams.get("q") || "";

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categories")?.split(",").filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(
    searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined
  );
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined
  );
  const [inStock, setInStock] = useState<boolean | undefined>(
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
    
    if (JSON.stringify(newCategories) !== JSON.stringify(selectedCategories)) {
      setSelectedCategories(newCategories);
      setCurrentPage(0);
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

    const queryParam = searchParams.get("q") || "";
    if (queryParam !== searchQuery) {
      setCurrentPage(0);
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

  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const updateURL = useCallback(
    (updates: {
      page?: number;
      categories?: string[];
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      sort?: string;
    }) => {
      const params = new URLSearchParams();
      
      // Preserve search query
      if (searchQuery) {
        params.set("q", searchQuery);
      }

      // Add filters
      if (updates.categories && updates.categories.length > 0) {
        params.set("categories", updates.categories.join(","));
      } else if (updates.categories && updates.categories.length === 0) {
        params.delete("categories");
      } else if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }

      if (updates.minPrice !== undefined) {
        params.set("minPrice", updates.minPrice.toString());
      } else if (minPrice !== undefined) {
        params.set("minPrice", minPrice.toString());
      }

      if (updates.maxPrice !== undefined) {
        params.set("maxPrice", updates.maxPrice.toString());
      } else if (maxPrice !== undefined) {
        params.set("maxPrice", maxPrice.toString());
      }

      if (updates.inStock !== undefined) {
        params.set("inStock", updates.inStock.toString());
      } else if (inStock !== undefined) {
        params.set("inStock", inStock.toString());
      }

      if (updates.sort) {
        params.set("sort", updates.sort);
      } else {
        params.set("sort", sort);
      }

      if (updates.page !== undefined) {
        params.set("page", updates.page.toString());
      } else {
        params.set("page", currentPage.toString());
      }

      router.push(`/search?${params.toString()}`);
    },
    [searchQuery, selectedCategories, minPrice, maxPrice, inStock, sort, currentPage, router]
  );

  const loadProducts = useCallback(async () => {
    if (!searchQuery.trim()) {
      setProducts([]);
      setLoading(false);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }

    setLoading(true);
    try {
      const params: ProductSearchParams = {
        searchTerm: searchQuery,
        categoryIds: selectedCategories,
        minPrice,
        maxPrice,
        inStock,
        page: currentPage,
        size: pageSize,
        sort,
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
  }, [searchQuery, selectedCategories, minPrice, maxPrice, inStock, currentPage, sort]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(newCategories);
    updateURL({ categories: newCategories, page: 0 });
  };

  const handlePriceFilter = () => {
    updateURL({ minPrice, maxPrice, page: 0 });
  };

  const handleInStockToggle = () => {
    const newInStock = inStock === true ? undefined : true;
    setInStock(newInStock);
    updateURL({ inStock: newInStock, page: 0 });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateURL({ sort: newSort, page: 0 });
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setInStock(undefined);
    setSort("name,asc");
    updateURL({
      categories: [],
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
      sort: "name,asc",
      page: 0,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      updateURL({ page: newPage });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStock !== undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {searchQuery ? `Search Results for "${searchQuery}"` : "Search Products"}
              </h1>
              {totalElements > 0 && (
                <p className="text-muted-foreground mt-2">
                  Found {totalElements} {totalElements === 1 ? "product" : "products"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {[
                      selectedCategories.length,
                      minPrice !== undefined ? 1 : 0,
                      maxPrice !== undefined ? 1 : 0,
                      inStock !== undefined ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-sm">
                Sort by:
              </Label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1.5 text-sm border border-input rounded-md bg-background"
              >
                <option value="name,asc">Name (A-Z)</option>
                <option value="name,desc">Name (Z-A)</option>
                <option value="price,asc">Price (Low to High)</option>
                <option value="price,desc">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:col-span-1"
              >
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>

                    <div className="space-y-6">
                      {/* Categories Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Categories
                        </Label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {categories.map((category) => (
                            <label
                              key={category.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category.id)}
                                onChange={() => handleCategoryToggle(category.id)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{category.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Price Range Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Price Range
                        </Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={minPrice || ""}
                              onChange={(e) =>
                                setMinPrice(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={maxPrice || ""}
                              onChange={(e) =>
                                setMaxPrice(
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              className="text-sm"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePriceFilter}
                            className="w-full"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>

                      {/* In Stock Filter */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inStock === true}
                            onChange={handleInStockToggle}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">In Stock Only</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div
            className={`${
              showFilters ? "lg:col-span-3" : "lg:col-span-4"
            } transition-all duration-300`}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !searchQuery ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Start Your Search
                  </h2>
                  <p className="text-muted-foreground">
                    Enter a search term to find products
                  </p>
                </CardContent>
              </Card>
            ) : products.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    No products found
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (currentPage < 3) {
                          pageNum = i;
                        } else if (currentPage > totalPages - 4) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum + 1}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

