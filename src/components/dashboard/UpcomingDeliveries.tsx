import { Calendar, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpcomingDeliveries } from "@/hooks/useDashboardStats";
import { differenceInDays } from "date-fns";

export function UpcomingDeliveries() {
  const { data: deliveries = [], isLoading } = useUpcomingDeliveries(5);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 md:px-6 py-3 md:py-4">
        <h3 className="font-display text-base md:text-lg font-semibold">Upcoming Deliveries</h3>
        <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Orders due in the next 14 days</p>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No upcoming deliveries
          </div>
        ) : (
          deliveries.map((delivery) => {
            const daysRemaining = differenceInDays(new Date(delivery.delivery_date), new Date());
            const items = delivery.order_items?.map((i) => 
              i.quantity > 1 ? `${i.garment_type} (${i.quantity})` : i.garment_type
            ).join(", ") || "No items";

            return (
              <div key={delivery.id} className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm md:text-base truncate">{delivery.customers?.name || "Unknown"}</span>
                      {delivery.priority && (
                        <span className="inline-flex items-center rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] md:text-xs font-medium text-destructive">
                          Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{delivery.order_number}</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-2 md:px-3 py-1 text-center shrink-0",
                      daysRemaining <= 0
                        ? "bg-destructive/15"
                        : daysRemaining <= 2
                        ? "bg-warning/15"
                        : "bg-muted"
                    )}
                  >
                    <p
                      className={cn(
                        "text-base md:text-lg font-bold",
                        daysRemaining <= 0
                          ? "text-destructive"
                          : daysRemaining <= 2
                          ? "text-warning"
                          : "text-foreground"
                      )}
                    >
                      {daysRemaining <= 0 ? "Today" : daysRemaining}
                    </p>
                    {daysRemaining > 0 && (
                      <p className="text-[9px] md:text-[10px] text-muted-foreground">days left</p>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-2 truncate">
                  {items}
                </p>
                <div className="flex items-center gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(delivery.delivery_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  {delivery.customers?.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {delivery.customers.phone}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}