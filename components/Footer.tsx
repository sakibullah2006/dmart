import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted w-full">
      <div className="w-full max-w-7xl mx-auto px-4 py-12 min-w-[320px]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">dMart</h3>
            <p className="text-sm text-muted-foreground">
              Daffodil International University's exclusive e-commerce platform. 
              Built by students, for students. Quality products, exclusive deals, seamless shopping.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Empowering the DIU community with innovative shopping solutions.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/deals" className="hover:text-primary transition-colors">
                  Special Deals
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} dMart - Daffodil International University. All rights reserved.</p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            An exclusive e-commerce platform for the DIU community
          </p>
        </div>
      </div>
    </footer>
  );
}

