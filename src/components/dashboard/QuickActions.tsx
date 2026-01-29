import { Link } from "react-router-dom";
import {
  FilePlus,
  UserPlus,
  Receipt,
  Ruler,
  Scissors,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const actions: QuickAction[] = [
  {
    title: "New Quotation",
    description: "Create a price estimate",
    icon: FilePlus,
    href: "/quotations/new",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
  },
  {
    title: "Add Customer",
    description: "Register new customer",
    icon: UserPlus,
    href: "/customers/new",
    color: "bg-success/10 text-success hover:bg-success/20",
  },
  {
    title: "Generate Invoice",
    description: "Bill a completed order",
    icon: Receipt,
    href: "/invoices/new",
    color: "bg-accent/20 text-accent-foreground hover:bg-accent/30",
  },
  {
    title: "Take Measurements",
    description: "Record body measurements",
    icon: Ruler,
    href: "/measurements/new",
    color: "bg-info/10 text-info hover:bg-info/20",
  },
  {
    title: "Print Job Card",
    description: "Stitching instructions",
    icon: Scissors,
    href: "/jobs",
    color: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  {
    title: "View Reports",
    description: "Business analytics",
    icon: FileText,
    href: "/reports",
    color: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 md:gap-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className={cn(
              "group flex items-center gap-2 md:gap-3 rounded-lg p-2 md:p-3 transition-all duration-200",
              action.color
            )}
          >
            <action.icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs md:text-sm truncate">{action.title}</p>
              <p className="text-[10px] md:text-xs opacity-70 truncate hidden sm:block">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
