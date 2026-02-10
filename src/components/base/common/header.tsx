import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import Navbar from "@/components/base/common/navbar";
import CartSheet from "@/components/containers/store/cart/cart-sheet";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { useCartStore } from "@/lib/store/cart-store";
import { ModeToggle } from "../provider/mode-toggle";
import { MobileMenu } from "./mobile-menu";
import UserMenu from "./user-menu";

const navigationItems = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Products" },
  { to: "/category", label: "Categories" },
];

export default function Header() {
  const { data } = useSession();
  const user = data?.user;
  const { totalItems, setIsOpen } = useCartStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Navbar items={navigationItems} />
        </div>

        <div className="flex items-center justify-center">
          <Link to="/" className="group flex items-center space-x-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg blur-sm opacity-0 group-hover:opacity-75 transition-all duration-300" />
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src="/logo.png"
                  alt="heywhymarketplace"
                  className="h-8 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-end space-x-2">
          <div className="hidden md:flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              aria-label="Open Cart"
              onClick={() => setIsOpen(true)}
              className="relative h-9 w-9 rounded-lg hover:bg-muted transition-all duration-200"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">
                  {totalItems}
                </span>
              )}
            </Button>
            <CartSheet />

            <div className="h-6 w-px bg-border/40 mx-1" />

            <ModeToggle />

            <div className="h-6 w-px bg-border/40 mx-1" />

            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link to="/auth/sign-in">
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  className="h-9 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02]"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <MobileMenu
              navigationItems={navigationItems}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Open menu"
                  className="h-9 w-9 rounded-lg"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
