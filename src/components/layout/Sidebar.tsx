import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, ClipboardList, Ruler, Scissors,
  Receipt, Users, Package, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Logo from "@/assets/logo2.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Orders", href: "/orders", icon: ClipboardList },
  { name: "Measurements", href: "/measurements", icon: Ruler },
  { name: "Job Cards", href: "/jobs", icon: Scissors },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const { signOut } = useAuth();
  const location = useLocation();
  // Default to collapsed as requested
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-50 flex-col bg-sidebar transition-all duration-300 border-r border-sidebar-border",
        isCollapsed ? "w-20" : "w-48"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-md z-50"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Logo Section */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border transition-all px-4", isCollapsed ? "justify-center" : "gap-3 px-6")}>
        <img src={Logo} alt="Logo" className="h-10 w-10 shrink-0" />
        {!isCollapsed && (
          <h1 className="font-display text-sm font-semibold text-sidebar-foreground truncate">
            NASEEM'S COUTURE
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50",
                isCollapsed ? "justify-center" : "gap-3"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50")} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        <button
          onClick={signOut}
          className={cn(
            "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-destructive/10 hover:text-destructive",
            isCollapsed ? "justify-center" : "gap-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}