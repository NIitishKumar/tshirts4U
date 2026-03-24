"use client";

import Link from "next/link";
import { ShoppingBag, Menu, X, Sun, Moon, User } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-context";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (res.ok && json?.user?.phone) {
          setUserPhone(json.user.phone);
        } else {
          setUserPhone(null);
        }
      } catch {
        if (active) setUserPhone(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }
    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUserPhone(null);
      window.location.href = "/";
    }
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border shadow-md shadow-foreground/5"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-baseline gap-0.5 text-foreground"
          >
            <span className="font-display text-2xl tracking-tight">
              tshirts
            </span>
            <span className="font-display text-2xl tracking-tight text-accent transition-transform duration-300 group-hover:-translate-y-0.5">
              4
            </span>
            <span className="font-display text-2xl tracking-tight">U</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-xs font-bold uppercase tracking-[0.15em] text-foreground/70 transition-colors duration-200 hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-all duration-200 hover:bg-muted hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-muted"
            >
              <ShoppingBag className="h-[18px] w-[18px] text-foreground" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {!authLoading &&
              (userPhone ? (
                <button
                  onClick={handleLogout}
                  className="hidden rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/80 transition hover:border-accent hover:text-accent md:inline-flex"
                  title={userPhone}
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hidden items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/80 transition hover:border-accent hover:text-accent md:inline-flex"
                >
                  <User className="h-3.5 w-3.5" />
                  Login
                </Link>
              ))}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-background md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-display text-4xl uppercase tracking-tight text-foreground transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            {!authLoading &&
              (userPhone ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    void handleLogout();
                  }}
                  className="font-display text-3xl uppercase tracking-tight text-foreground transition-colors hover:text-accent"
                >
                  Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="font-display text-3xl uppercase tracking-tight text-foreground transition-colors hover:text-accent"
                >
                  Login
                </Link>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
