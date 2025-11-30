"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { fetchOrderById, fetchProductPrimaryImageUrl, type Order, type OrderItem } from "@/lib/api";
import { Package, Truck, CheckCircle, XCircle, Clock, Loader2, ArrowLeft, MapPin, CreditCard, Mail, Phone, FileText } from "lucide-react";
import { motion } from "framer-motion";

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-50" },
  CONFIRMED: { label: "Confirmed", icon: CheckCircle, color: "text-blue-500", bgColor: "bg-blue-50" },
  SHIPPED: { label: "Shipped", icon: Truck, color: "text-purple-500", bgColor: "bg-purple-50" },
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
  
  const unitPrice = item.price ?? item.unitPrice ?? 0;
  
  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      <div className="w-20 h-20 rounded-lg bg-secondary/30 flex-shrink-0 relative overflow-hidden">
        {imageError || !imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
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
        <Link href={`/products/${item.productId}`}>
          <h4 className="font-medium text-foreground hover:text-primary transition-colors">
            {item.productName}
          </h4>
        </Link>
        {item.productSku && (
          <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.productSku}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            Quantity: {item.quantity} × ${unitPrice.toFixed(2)}
          </p>
          <p className="text-sm font-semibold text-foreground">
            ${(item.subtotal || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AddressCard({ title, address, icon: Icon }: { title: string; address?: any; icon: any }) {
  if (!address) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">{address.addressLine1}</p>
          {address.addressLine2 && (
            <p className="text-muted-foreground">{address.addressLine2}</p>
          )}
          <p className="text-muted-foreground">
            {address.city}, {address.state} {address.postalCode}
          </p>
          <p className="text-muted-foreground">{address.country}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && orderId) {
      loadOrder();
    }
  }, [isAuthenticated, authLoading, orderId, router]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrderById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (loading && !order)) {
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

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">
                {error || "Order not found"}
              </p>
              <p className="text-muted-foreground mb-4">
                {error 
                  ? "We couldn't load this order. Please try again later."
                  : "The order you're looking for doesn't exist or you don't have permission to view it."}
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={loadOrder}>
                  Retry
                </Button>
                <Button asChild>
                  <Link href="/orders">View All Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;
  const statusInfo = statusConfig[order.status];
  const paymentStatus = order.payment?.paymentStatus ?? order.payment?.status ?? 'PENDING';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>

        {/* Order Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      Order {order.orderNumber}
                    </h1>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusInfo.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <div className="flex items-center gap-1.5">
                        <span>
                          Updated on {new Date(order.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ${(order.totalAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-0">
                      {order.items.map((item) => (
                        <OrderItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">No items found</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Information */}
            {order.payment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment Method</span>
                        <span className="text-sm font-medium text-foreground">
                          {order.payment.method || order.payment.paymentMethod || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment Status</span>
                        <div className="flex items-center gap-2">
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
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="text-sm font-medium text-foreground">
                          ${(order.payment.amount || 0).toFixed(2)}
                        </span>
                      </div>
                      {order.payment.transactionId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Transaction ID</span>
                          <span className="text-sm font-mono text-foreground">
                            {order.payment.transactionId}
                          </span>
                        </div>
                      )}
                      {order.payment.cardLastFour && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Card</span>
                          <span className="text-sm font-medium text-foreground">
                            **** **** **** {order.payment.cardLastFour}
                          </span>
                        </div>
                      )}
                      {order.payment.paymentDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Payment Date</span>
                          <span className="text-sm font-medium text-foreground">
                            {new Date(order.payment.paymentDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.customerEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{order.customerEmail}</span>
                      </div>
                    )}
                    {order.customerPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{order.customerPhone}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Order Notes</p>
                          <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Shipping Address */}
            {order.shippingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AddressCard
                  title="Shipping Address"
                  address={order.shippingAddress}
                  icon={Truck}
                />
              </motion.div>
            )}

            {/* Billing Address */}
            {order.billingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AddressCard
                  title="Billing Address"
                  address={order.billingAddress}
                  icon={MapPin}
                />
              </motion.div>
            )}

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        ${(order.items?.reduce((sum, item) => sum + (item.subtotal || 0), 0) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-lg font-bold text-primary">
                        ${(order.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

