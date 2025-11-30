"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, ChevronDown, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/UserMenu";
import { fetchCategories, type Category } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";

export function Header() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { cart, openCart, fetchCart } = useCartStore();

  // Fetch cart on mount to get item count
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const handleSearchButtonClick = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  useEffect(() => {
    loadCategories();
  }, []);


  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-4 min-w-[320px] flex h-20 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">dMart</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">DIU Exclusive</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2">
              Home
            </Link>
            <Link href="/shop" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2">
              Shop
            </Link>
            <div
              ref={categoryDropdownRef}
              className="relative"
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <button
                type="button"
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 py-2"
              >
                Categories
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${
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
                    className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
                    {categories.length === 0 ? (
                      <div className="p-4 text-center text-base text-muted-foreground">
                        Loading categories...
                      </div>
                    ) : (
                      <div className="py-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/shop?categories=${category.id}`}
                            onClick={() => setShowCategoryDropdown(false)}
                            className="block w-full p-4 text-left hover:bg-secondary/50 transition-colors text-base"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* Expandable Search */}
          <div 
            ref={searchContainerRef}
            className="hidden sm:flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={false}
              animate={{
                width: isSearchExpanded ? "300px" : "0px",
                opacity: isSearchExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full pr-8"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchExpanded(false);
                      setSearchQuery("");
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </form>
            </motion.div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleSearchButtonClick();
              }}
              className="flex-shrink-0 ml-2"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {cart && cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cart.totalItems > 99 ? "99+" : cart.totalItems}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Button>
          <UserMenu />
          {/* Mobile Search */}
          <div 
            ref={searchContainerRef}
            className="md:hidden flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={false}
              animate={{
                width: isSearchExpanded ? "200px" : "0px",
                opacity: isSearchExpanded ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="w-full relative" onClick={(e) => e.stopPropagation()}>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full pr-8"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchExpanded(false);
                      setSearchQuery("");
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </form>
            </motion.div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleSearchButtonClick();
              }}
              className="flex-shrink-0 ml-2"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

