import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Navbar from "./navbar";

export interface MobileMenuProps {
  navigationItems: { to: string; label: string }[];
  trigger: ReactNode;
}

export function MobileMenu({ navigationItems, trigger }: MobileMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-80 p-6">
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <Navbar 
              items={navigationItems} 
              className="flex flex-col space-y-1" 
              linkClassName="h-10 px-3 justify-start rounded-md text-muted-foreground/90 hover:text-foreground"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-4 border-t">
            <SheetClose asChild>
              <Button variant="ghost" size="sm" aria-label="Open cart" className="h-9 w-9 rounded-lg">
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </SheetClose>
            {/* {user ? (
              <UserMenu user={user} />
            ) : (
              <SheetClose asChild>
                <Link to="/auth/sign-in" className="w-full">
                  <Button variant="default" size="sm" className="w-full h-9 rounded-lg">
                    Sign In
                  </Button>
                </Link>
              </SheetClose>
            )} */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
