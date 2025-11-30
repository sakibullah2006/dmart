"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stepper } from "@/components/ui/stepper";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import {
  createOrder,
  processPayment,
  fetchProductPrimaryImageUrl,
  type CreateOrderRequest,
  type ProcessPaymentRequest,
  type Address,
  type Order,
} from "@/lib/api";
import {
  Package,
  ShoppingBag,
  Loader2,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Truck,
  MapPin,
  FileText,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { label: "Cart Review", description: "Review items" },
  { label: "Shipping", description: "Shipping address" },
  { label: "Billing", description: "Billing address" },
  { label: "Payment", description: "Payment method" },
  { label: "Review", description: "Confirm order" },
];

// Additional step for payment details (shown conditionally)
const PAYMENT_DETAILS_STEP = 5;

type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL" | "BANK_TRANSFER" | "CASH_ON_DELIVERY";

function CartReviewStep({ onNext }: { onNext: () => void }) {
  const { cart, loading } = useCartStore();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (cart?.items) {
      cart.items.forEach(async (item) => {
        if (!imageUrls[item.product.id]) {
          const url = await fetchProductPrimaryImageUrl(item.product.id);
          if (url) {
            const publicIdMatch = url.match(/\/images\/([^\/]+)$/);
            if (publicIdMatch && publicIdMatch[1]) {
              setImageUrls((prev) => ({
                ...prev,
                [item.product.id]: `/api/images/${publicIdMatch[1]}`,
              }));
            }
          }
        }
      });
    }
  }, [cart, imageUrls]);

  if (!cart || cart.items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add items to your cart to checkout.</p>
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 rounded-lg bg-secondary/30 flex-shrink-0 relative overflow-hidden">
              {imageErrors[item.product.id] || !imageUrls[item.product.id] ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <Image
                  src={imageUrls[item.product.id]}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => setImageErrors((prev) => ({ ...prev, [item.product.id]: true }))}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{item.product.name}</h3>
              <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  {item.quantity} × ${item.currentPrice.toFixed(2)}
                </span>
                <span className="font-semibold text-foreground">
                  ${item.subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({cart.totalItems} items):</span>
              <span className="text-foreground">${cart.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="text-foreground">Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span className="text-foreground">Calculated at checkout</span>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  ${cart.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} size="lg">
          Continue to Shipping
        </Button>
      </div>
    </div>
  );
}

function AddressForm({
  title,
  address,
  onChange,
  onUseShipping,
  showUseShipping = false,
}: {
  title: string;
  address: Address;
  onChange: (address: Address) => void;
  onUseShipping?: () => void;
  showUseShipping?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          {showUseShipping && (
            <Button variant="ghost" size="sm" onClick={onUseShipping}>
              Use shipping address
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="addressLine1">Address Line 1 *</Label>
          <Input
            id="addressLine1"
            value={address.addressLine1}
            onChange={(e) => onChange({ ...address, addressLine1: e.target.value })}
            placeholder="Street address"
            required
          />
        </div>
        <div>
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input
            id="addressLine2"
            value={address.addressLine2 || ""}
            onChange={(e) => onChange({ ...address, addressLine2: e.target.value })}
            placeholder="Apartment, suite, etc. (optional)"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => onChange({ ...address, city: e.target.value })}
              placeholder="City"
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State/Province *</Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) => onChange({ ...address, state: e.target.value })}
              placeholder="State"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={address.postalCode}
              onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
              placeholder="ZIP/Postal code"
              required
            />
          </div>
          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => onChange({ ...address, country: e.target.value })}
              placeholder="Country"
              required
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShippingStep({
  shippingAddress,
  onShippingChange,
  onNext,
  onBack,
}: {
  shippingAddress: Address;
  onShippingChange: (address: Address) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid =
    shippingAddress.addressLine1 &&
    shippingAddress.city &&
    shippingAddress.state &&
    shippingAddress.postalCode &&
    shippingAddress.country;

  return (
    <div className="space-y-6">
      <AddressForm title="Shipping Address" address={shippingAddress} onChange={onShippingChange} />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Continue to Billing
        </Button>
      </div>
    </div>
  );
}

function BillingStep({
  shippingAddress,
  billingAddress,
  onBillingChange,
  onNext,
  onBack,
}: {
  shippingAddress: Address;
  billingAddress: Address;
  onBillingChange: (address: Address) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const handleUseShipping = () => {
    onBillingChange({ ...shippingAddress });
  };

  const isValid =
    billingAddress.addressLine1 &&
    billingAddress.city &&
    billingAddress.state &&
    billingAddress.postalCode &&
    billingAddress.country;

  return (
    <div className="space-y-6">
      <AddressForm
        title="Billing Address"
        address={billingAddress}
        onChange={onBillingChange}
        onUseShipping={handleUseShipping}
        showUseShipping={true}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}

function PaymentMethodStep({
  paymentMethod,
  onPaymentMethodChange,
  customerEmail,
  customerPhone,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  onNext,
  onBack,
}: {
  paymentMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  customerEmail: string;
  customerPhone: string;
  onCustomerEmailChange: (email: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: "CREDIT_CARD", label: "Credit Card", icon: <CreditCard className="h-5 w-5" /> },
    { value: "DEBIT_CARD", label: "Debit Card", icon: <CreditCard className="h-5 w-5" /> },
    { value: "PAYPAL", label: "PayPal", icon: <CreditCard className="h-5 w-5" /> },
    { value: "BANK_TRANSFER", label: "Bank Transfer", icon: <CreditCard className="h-5 w-5" /> },
    { value: "CASH_ON_DELIVERY", label: "Cash on Delivery", icon: <Truck className="h-5 w-5" /> },
  ];

  const isValid = paymentMethod && customerEmail;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => onPaymentMethodChange(method.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  paymentMethod === method.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded ${
                      paymentMethod === method.value ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {method.icon}
                  </div>
                  <span className="font-medium">{method.label}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="customerEmail">Email *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => onCustomerEmailChange(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function PaymentDetailsStep({
  paymentDetails,
  onPaymentDetailsChange,
  onNext,
  onBack,
}: {
  paymentDetails: ProcessPaymentRequest["paymentDetails"];
  onPaymentDetailsChange: (details: ProcessPaymentRequest["paymentDetails"]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Validate: card number must be 16 digits (after removing spaces), expiryDate in MM/YY format, CVV required
  const cardNumberDigits = paymentDetails.cardNumber.replace(/\s/g, "");
  const isValid =
    cardNumberDigits.length === 16 &&
    /^\d+$/.test(cardNumberDigits) &&
    paymentDetails.cardHolderName &&
    paymentDetails.expiryDate &&
    /^\d{2}\/\d{2}$/.test(paymentDetails.expiryDate) &&
    paymentDetails.cvv &&
    paymentDetails.cvv.length >= 3;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(" ").substring(0, 19) : cleaned.substring(0, 16);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) {
      return cleaned;
    }
    // Format as MM/YY (2-digit year)
    return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              value={paymentDetails.cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                onPaymentDetailsChange({ ...paymentDetails, cardNumber: formatted });
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {cardNumberDigits.length > 0 && cardNumberDigits.length !== 16 && (
                <span className="text-destructive">Card number must be 16 digits</span>
              )}
              {cardNumberDigits.length === 16 && (
                <span>Test cards: 4111111111111111 (Success), xxxxxxxx0000 (Failed)</span>
              )}
            </p>
          </div>
          <div>
            <Label htmlFor="cardHolderName">Card Holder Name *</Label>
            <Input
              id="cardHolderName"
              value={paymentDetails.cardHolderName}
              onChange={(e) =>
                onPaymentDetailsChange({ ...paymentDetails, cardHolderName: e.target.value })
              }
              placeholder="John Doe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                value={paymentDetails.expiryDate}
                onChange={(e) => {
                  const formatted = formatExpiryDate(e.target.value);
                  onPaymentDetailsChange({ ...paymentDetails, expiryDate: formatted });
                }}
                placeholder="MM/YY"
                maxLength={5}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: MM/YY (e.g., 12/25)
              </p>
            </div>
            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                type="password"
                value={paymentDetails.cvv}
                onChange={(e) =>
                  onPaymentDetailsChange({ ...paymentDetails, cvv: e.target.value.replace(/\D/g, "") })
                }
                placeholder="123"
                maxLength={4}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  cart,
  shippingAddress,
  billingAddress,
  paymentMethod,
  customerEmail,
  customerPhone,
  notes,
  onNotesChange,
  onPlaceOrder,
  onBack,
  loading,
}: {
  cart: any;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod | null;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  onNotesChange: (notes: string) => void;
  onPlaceOrder: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Shipping Address</h4>
            <p className="text-sm text-muted-foreground">
              {shippingAddress.addressLine1}
              {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
              <br />
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              <br />
              {shippingAddress.country}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Billing Address</h4>
            <p className="text-sm text-muted-foreground">
              {billingAddress.addressLine1}
              {billingAddress.addressLine2 && `, ${billingAddress.addressLine2}`}
              <br />
              {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
              <br />
              {billingAddress.country}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Payment Method</h4>
            <p className="text-sm text-muted-foreground">
              {paymentMethod?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Contact</h4>
            <p className="text-sm text-muted-foreground">
              {customerEmail}
              {customerPhone && <><br />{customerPhone}</>}
            </p>
          </div>
          <div>
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Special delivery instructions..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">Total:</span>
              <span className="text-2xl font-bold text-primary">
                ${cart?.totalPrice.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={onPlaceOrder} disabled={loading} size="lg" className="min-w-[150px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Place Order"
          )}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, fetchCart } = useCartStore();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<Address>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [billingAddress, setBillingAddress] = useState<Address>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<ProcessPaymentRequest["paymentDetails"]>({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (isAuthenticated && user?.email) {
      setCustomerEmail(user.email);
    }

    fetchCart();
  }, [isAuthenticated, authLoading, user, router, fetchCart]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      if (!authLoading && isAuthenticated) {
        router.push("/cart");
      }
    }
  }, [cart, authLoading, isAuthenticated, router]);

  const needsPaymentDetails = (method: PaymentMethod | null) => {
    return method === "CREDIT_CARD" || method === "DEBIT_CARD";
  };

  const handleNext = () => {
    if (currentStep === 3 && needsPaymentDetails(paymentMethod)) {
      // If payment method requires details, go to payment details step
      setCurrentStep(PAYMENT_DETAILS_STEP);
    } else if (currentStep === PAYMENT_DETAILS_STEP) {
      // After payment details, go to review
      setCurrentStep(4);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    if (currentStep === 4 && needsPaymentDetails(paymentMethod)) {
      // If on review and payment details were shown, go back to payment details
      setCurrentStep(PAYMENT_DETAILS_STEP);
    } else if (currentStep === PAYMENT_DETAILS_STEP) {
      // From payment details, go back to payment method
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Re-fetch cart to ensure we have the latest data before creating order
      await fetchCart();
      
      // Check cart again after fetching
      const currentCart = useCartStore.getState().cart;
      if (!currentCart || currentCart.items.length === 0) {
        setError("Your cart is empty. Please add items to your cart before checkout.");
        setLoading(false);
        router.push("/cart");
        return;
      }

      // Create order
      const orderRequest: CreateOrderRequest = {
        shippingAddress,
        billingAddress,
        customerEmail,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
        paymentMethod,
      };

      const order = await createOrder(orderRequest);
      setCreatedOrder(order);

      // Process payment if needed
      let finalOrder = order;
      if (needsPaymentDetails(paymentMethod)) {
        // Format payment details for API: remove spaces from card number, ensure expiryDate format
        const cardNumber = paymentDetails.cardNumber.replace(/\s/g, "");
        const paymentRequest: ProcessPaymentRequest = {
          paymentDetails: {
            cardNumber: cardNumber,
            cardHolderName: paymentDetails.cardHolderName,
            expiryDate: paymentDetails.expiryDate, // Format: MM/YY
            cvv: paymentDetails.cvv,
          },
        };
        finalOrder = await processPayment(order.id, paymentRequest);
        setCreatedOrder(finalOrder);
      }

      // Clear cart and redirect to orders page
      // Only clear cart if order was successfully created and payment processed (if needed)
      if (finalOrder && finalOrder.status !== "CANCELLED") {
        await useCartStore.getState().clear();
        router.push(`/orders?success=true&orderId=${finalOrder.id}`);
      } else {
        // If payment failed, don't clear cart
        setError("Payment failed. Please try again or use a different payment method.");
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to place order";
      setError(errorMessage);
      setLoading(false);
      
      // If error is about empty cart, redirect to cart page
      if (errorMessage.toLowerCase().includes("cart is empty")) {
        setTimeout(() => {
          router.push("/cart");
        }, 2000);
      }
    }
  };

  if (authLoading || !cart) {
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

  if (!isAuthenticated || !cart || cart.items.length === 0) {
    return null;
  }

  // Determine which step to show in stepper (payment details is hidden from stepper)
  const stepperStep = currentStep === PAYMENT_DETAILS_STEP ? 3 : currentStep;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <div className="mb-8">
          <Stepper steps={STEPS} currentStep={stepperStep} />
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && <CartReviewStep onNext={handleNext} />}
            {currentStep === 1 && (
              <ShippingStep
                shippingAddress={shippingAddress}
                onShippingChange={setShippingAddress}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 2 && (
              <BillingStep
                shippingAddress={shippingAddress}
                billingAddress={billingAddress}
                onBillingChange={setBillingAddress}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <PaymentMethodStep
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                onCustomerEmailChange={setCustomerEmail}
                onCustomerPhoneChange={setCustomerPhone}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep
                cart={cart}
                shippingAddress={shippingAddress}
                billingAddress={billingAddress}
                paymentMethod={paymentMethod}
                customerEmail={customerEmail}
                customerPhone={customerPhone}
                notes={notes}
                onNotesChange={setNotes}
                onPlaceOrder={handlePlaceOrder}
                onBack={handleBack}
                loading={loading}
              />
            )}
            {currentStep === PAYMENT_DETAILS_STEP && (
              <PaymentDetailsStep
                paymentDetails={paymentDetails}
                onPaymentDetailsChange={setPaymentDetails}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

