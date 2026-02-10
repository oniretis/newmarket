import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
}

export default function Navbar({
  items,
  className = "hidden items-center space-x-1 text-sm lg:flex",
  linkClassName = "",
  activeLinkClassName = "",
}: NavBarProps) {
  return (
    <nav className={cn(className)}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "relative h-9 px-3 flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "text-muted-foreground/90 hover:text-foreground",
            linkClassName
          )}
          activeProps={{
            className: cn(
              "h-9 px-3 rounded-md text-sm font-medium bg-accent text-accent-foreground shadow-sm",
              activeLinkClassName
            ),
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
