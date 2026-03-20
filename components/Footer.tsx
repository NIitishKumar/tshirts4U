import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <Link href="/" className="group flex items-baseline gap-0.5 text-foreground">
              <span className="font-display text-2xl tracking-tight">tshirts</span>
              <span className="font-display text-2xl tracking-tight text-accent">4</span>
              <span className="font-display text-2xl tracking-tight">U</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed tracking-wide text-muted-foreground">
              Premium streetwear tees. Bold designs, heavyweight fabrics,
              and fits that speak louder than words.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
              Quick links
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm tracking-wide text-muted-foreground">
              <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
              <Link href="/shop" className="transition-colors hover:text-foreground">Shop</Link>
              <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
              <Link href="/cart" className="transition-colors hover:text-foreground">Cart</Link>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
              Follow us
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm tracking-wide text-muted-foreground">
              <a href="#" className="transition-colors hover:text-foreground">Instagram</a>
              <a href="#" className="transition-colors hover:text-foreground">Pinterest</a>
              <a href="#" className="transition-colors hover:text-foreground">Twitter / X</a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} tshirts4U. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Made with care &hearts;
          </p>
        </div>
      </div>
    </footer>
  );
}
