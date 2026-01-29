import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "gold" | "success" | "warning";
  className?: string;
}

const variantStyles = {
  default: {
    card: "",
    icon: "bg-secondary text-secondary-foreground",
  },
  primary: {
    card: "bg-primary text-primary-foreground",
    icon: "bg-primary-foreground/20 text-primary-foreground",
  },
  gold: {
    card: "",
    icon: "bg-accent/20 text-accent",
  },
  success: {
    card: "",
    icon: "bg-success/15 text-success",
  },
  warning: {
    card: "",
    icon: "bg-warning/15 text-warning",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "stat-card p-4 md:p-6",
        variant === "primary" && "bg-primary text-primary-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 md:space-y-2 min-w-0 flex-1">
          <p
            className={cn(
              "text-xs md:text-sm font-medium truncate",
              variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <p className="text-xl md:text-3xl font-bold font-display tracking-tight truncate">{value}</p>
          {subtitle && (
            <p
              className={cn(
                "text-xs md:text-sm truncate hidden sm:block",
                variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 text-xs md:text-sm">
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span
                className={cn(
                  "hidden sm:inline",
                  variant === "primary" ? "text-primary-foreground/60" : "text-muted-foreground"
                )}
              >
                vs last month
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl shrink-0",
            styles.icon
          )}
        >
          <Icon className="h-5 w-5 md:h-6 md:w-6" />
        </div>
      </div>
    </div>
  );
}
