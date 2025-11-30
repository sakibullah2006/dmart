import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AnimatedHomeContent } from "@/components/AnimatedHomeContent";
import { fetchFeaturedProducts } from "@/lib/api";

export default async function Home() {
  const products = await fetchFeaturedProducts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AnimatedHomeContent products={products} />
      <Footer />
    </div>
  );
}
