"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { motion } from "framer-motion";

export default function AdminPage() {
  const { isAdmin, isAuthenticated, loading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/");
    }
  }, [isAdmin, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex-1 py-8 bg-background overflow-hidden">
        <BackgroundPattern variant="mesh" intensity="subtle" />
        <div className="relative w-full max-w-7xl mx-auto px-4 min-w-[320px] z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
              <p className="text-muted-foreground">Manage products, orders, categories, and more</p>
            </div>
            <AdminTabs />
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

