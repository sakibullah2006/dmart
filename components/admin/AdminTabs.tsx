"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsAdmin } from "./ProductsAdmin";
import { CategoriesAdmin } from "./CategoriesAdmin";
import { AttributesAdmin } from "./AttributesAdmin";
import { OrdersAdmin } from "./OrdersAdmin";
import { UsersAdmin } from "./UsersAdmin";
import { PaymentsAdmin } from "./PaymentsAdmin";
import { MediaAdmin } from "./MediaAdmin";
import {
  Package,
  FolderTree,
  Tag,
  ShoppingCart,
  Users,
  CreditCard,
  Image,
} from "lucide-react";

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-7 mb-6">
        <TabsTrigger value="products" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Products
        </TabsTrigger>
        <TabsTrigger value="categories" className="flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          Categories
        </TabsTrigger>
        <TabsTrigger value="attributes" className="flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Attributes
        </TabsTrigger>
        <TabsTrigger value="media" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Media
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="mt-0">
        <ProductsAdmin />
      </TabsContent>

      <TabsContent value="categories" className="mt-0">
        <CategoriesAdmin />
      </TabsContent>

      <TabsContent value="attributes" className="mt-0">
        <AttributesAdmin />
      </TabsContent>

      <TabsContent value="media" className="mt-0">
        <MediaAdmin />
      </TabsContent>

      <TabsContent value="orders" className="mt-0">
        <OrdersAdmin />
      </TabsContent>

      <TabsContent value="users" className="mt-0">
        <UsersAdmin />
      </TabsContent>

      <TabsContent value="payments" className="mt-0">
        <PaymentsAdmin />
      </TabsContent>
    </Tabs>
  );
}

