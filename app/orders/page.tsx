"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { fetchMyOrders, fetchProductPrimaryImageUrl, type Order, type OrderItem } from "@/lib/api";
import { Package, Truck, CheckCircle, XCircle, Clock, ShoppingBag, Loader2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-50" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle, color: "text-blue-500", bgColor: "bg-blue-50" },
  SHIPPED: { label: "Shipped", icon: Truck, color: "text-purple-500", bgColor: "bg-purple-50 " },
  DELIVERED: { label: "Delivered", icon: Package, color: "text-green-500", bgColor: "bg-green-50" },
  CANCELLED: { label: "Cancelled", icon: XCircle, color: "text-red-500", bgColor: "bg-red-50" },
};

function OrderItemCard({ item }: { item: OrderItem }) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const loadImage = async () => {
      const url = await fetchProductPrimaryImageUrl(item.productId);
      if (url) {
        const publicIdMatch = url.match(/\/images\/([^\/]+)$/);
        if (publicIdMatch && publicIdMatch[1]) {
          setImageUrl(`/api/images/${publicIdMatch[1]}`);
        } else {
          const publicId = url.split('/').pop();
          if (publicId) {
            setImageUrl(`/api/images/${publicId}`);
          }
        }
      }
    };
    loadImage();
  }, [item.productId]);
  
  // Support both 'price' and 'unitPrice' for backward compatibility
  const unitPrice = item.price ?? item.unitPrice ?? 0;
  
  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-b-0">
      <div className="w-16 h-16 rounded-lg bg-secondary/30 flex-shrink-0 relative overflow-hidden">
        {imageError || !imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        ) : (
          <Image
            src={imageUrl}
            alt={item.productName}
            fill
            className="object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground">{item.productName}</h4>
        {item.productSku && (
          <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.productSku}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Quantity: {item.quantity} × ${unitPrice.toFixed(2)}
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">
          ${(item.subtotal || 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const StatusIcon = statusConfig[order.status].icon;
  const statusInfo = statusConfig[order.status];
  // Support both paymentStatus and status for backward compatibility
  const paymentStatus = order.payment?.paymentStatus ?? order.payment?.status ?? 'PENDING';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Order Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-foreground">
                    {order.orderNumber}
                  </h3>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <span className={`text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {order.payment && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Payment:</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        paymentStatus === 'COMPLETED' 
                          ? 'bg-green-400' :
                        paymentStatus === 'FAILED' 
                          ? 'bg-red-500' :
                        paymentStatus === 'REFUNDED'
                          ? 'bg-purple-500' :
                        'bg-yellow-500'
                      }`} />
                      <span className="text-sm font-medium text-foreground">
                        {paymentStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  ${(order.totalAmount || 0).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Order Items</h4>
              <div className="space-y-0">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <OrderItemCard key={item.id} item={item} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No items found</p>
                )}
              </div>
            </div>

            {/* View Details Button */}
            <div className="pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/orders/${order.id}`} className="flex items-center justify-center">
                  <Eye className="h-4 w-4 mr-2" />
                  View Order Details
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated) {
      loadOrders();
    }

    // Check for success parameter from checkout
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Remove success parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("success");
      newUrl.searchParams.delete("orderId");
      window.history.replaceState({}, "", newUrl.toString());
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [isAuthenticated, authLoading, page, router, searchParams]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchMyOrders(page, 10, "createdAt,desc");
      setOrders(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && orders.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          {totalElements > 0 && (
            <p className="text-muted-foreground mt-2">
              {totalElements} {totalElements === 1 ? 'order' : 'orders'} total
            </p>
          )}
        </div>

        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <Card className="border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Order placed successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your order has been confirmed and you will receive a confirmation email shortly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button variant="outline" onClick={loadOrders}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

