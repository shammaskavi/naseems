import { Link } from "react-router-dom";
import { ArrowRight, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecentOrders } from "@/hooks/useDashboardStats";

const statusConfig: Record<string, { label: string; className: string }> = {
  created: { label: "Created", className: "status-badge bg-muted text-muted-foreground" },
  measurement_pending: { label: "Measurement Pending", className: "status-badge status-pending" },
  in_production: { label: "In Production", className: "status-badge status-sent" },
  ready: { label: "Ready", className: "status-badge status-ready" },
  delivered: { label: "Delivered", className: "status-badge status-delivered" },
  closed: { label: "Closed", className: "status-badge status-locked" },
};

export function RecentOrders() {
  const { data: orders = [], isLoading } = useRecentOrders(5);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div>
          <h3 className="font-display text-base md:text-lg font-semibold">Recent Orders</h3>
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Latest orders and their status</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs md:text-sm">
          <Link to="/orders" className="gap-1">
            View All <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
          </Link>
        </Button>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No orders yet
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.created;
            const items = order.order_items?.map((i) => 
              i.quantity > 1 ? `${i.garment_type} (${i.quantity})` : i.garment_type
            ).join(", ") || "No items";

            return (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 md:px-6 py-3 md:py-4 hover:bg-muted/30 transition-colors gap-2 sm:gap-4"
              >
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-secondary shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm md:text-base truncate">{order.customers?.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {order.order_number}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {items}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="font-semibold text-sm md:text-base">₹{order.total.toLocaleString("en-IN")}</p>
                    {order.delivery_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(order.delivery_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    )}
                  </div>
                  <span className={cn(status.className, "text-xs whitespace-nowrap")}>{status.label}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}