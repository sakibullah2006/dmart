"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/api";

interface AnimatedHomeContentProps {
  products: Product[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export function AnimatedHomeContent({ products }: AnimatedHomeContentProps) {
  return (
    <main className="flex-1 flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 w-full bg-background">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-primary/20" />
        
        {/* Animated lines */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <BackgroundPattern variant="mesh" intensity="medium" />
        
        <div className="relative w-full max-w-7xl mx-auto px-4">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 backdrop-blur-sm px-4 py-2 text-sm text-primary shadow-lg ring-1 ring-primary/20"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Daffodil International University Exclusive</span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Welcome to dMart
              </span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Your Exclusive E-Commerce Platform
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="mb-4 text-lg text-muted-foreground md:text-xl leading-relaxed"
            >
              Empowering the DIU community with quality products, exclusive deals, and seamless shopping experience.
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="mb-8 text-base text-muted-foreground/80 md:text-lg"
            >
              Built by students, for students. Shop smart, shop exclusive.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            >
              <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg" asChild>
                <Link href="/shop" className="flex items-center gap-2">
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 border-primary/30 hover:bg-primary/10" asChild>
                <Link href="/shop">Explore Products</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      {products.length > 0 && (
        <motion.section
          className="py-16 md:py-24 w-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="w-full max-w-7xl mx-auto px-4 min-w-[320px]">
            <motion.div variants={itemVariants} className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
                Featured Products
              </h2>
              <p className="text-muted-foreground">
                Curated selections exclusively for the DIU community
              </p>
            </motion.div>
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {products.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
            {products.length > 8 && (
              <motion.div
                variants={itemVariants}
                className="mt-12 text-center"
              >
              <Button variant="outline" size="lg" asChild>
                <Link href="/shop">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              </motion.div>
            )}
          </div>
        </motion.section>
      )}

      {/* Features Section */}
      <motion.section
        className="border-t border-border bg-secondary/30 py-16 md:py-24 w-full"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="w-full max-w-7xl mx-auto px-4 min-w-[320px]">
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {[
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ),
                title: "Authenticity Guaranteed",
                description: "Every product is carefully authenticated and quality-checked",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ),
                title: "Premium Delivery",
                description: "White-glove shipping service to your doorstep",
              },
              {
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                ),
                title: "Secure Transactions",
                description: "Your payments are protected with bank-grade encryption",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}

