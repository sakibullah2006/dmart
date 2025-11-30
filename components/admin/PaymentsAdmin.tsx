"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchOrdersPaginated, updatePaymentStatus, type Order, type Payment } from "@/lib/adminApi";
import { Search, CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const paymentStatusConfig = {
  PENDING: { label: "Pending", icon: Clock, color: "text-yellow-500" },
  COMPLETED: { label: "Completed", icon: CheckCircle, color: "text-green-500" },
  FAILED: { label: "Failed", icon: XCircle, color: "text-red-500" },
  REFUNDED: { label: "Refunded", icon: RefreshCw, color: "text-blue-500" },
};

export function PaymentsAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchOrdersPaginated(page, 20, "createdAt,desc");
      setOrders(response.content);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: string) => {
    try {
      await updatePaymentStatus(orderId, paymentStatus);
      await loadOrders();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update payment status");
    }
  };

  const ordersWithPayments = orders.filter((order) => order.payment);
  const filteredOrders = ordersWithPayments.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.payment?.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && orders.length === 0) {
    return <div className="text-center text-muted-foreground">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Payments</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          if (!order.payment) return null;
          const payment = order.payment;
          // Support both paymentStatus and status for backward compatibility
          const paymentStatus = (payment.paymentStatus || payment.status || 'PENDING') as keyof typeof paymentStatusConfig;
          const statusConfig = paymentStatusConfig[paymentStatus] || paymentStatusConfig.PENDING;
          const StatusIcon = statusConfig.icon;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              layout
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg text-foreground">
                          Order: {order.orderNumber}
                        </h3>
                        <div
                          className={`flex items-center gap-1 ${statusConfig.color}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.customerEmail}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Amount: ${payment.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Method: {payment.method || payment.paymentMethod || 'N/A'}
                        </p>
                        {payment.transactionId && (
                          <p className="text-sm text-muted-foreground">
                            Transaction ID: {payment.transactionId}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(payment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <select
                        value={paymentStatus}
                        onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {filteredOrders.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          {ordersWithPayments.length === 0
            ? "No payments found"
            : "No payments match your search"}
        </div>
      )}
    </div>
  );
}

