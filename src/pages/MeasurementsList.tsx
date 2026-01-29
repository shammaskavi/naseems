import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, Ruler, CheckCircle } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useMeasurementSet } from "@/hooks/useMeasurements";
import { cn } from "@/lib/utils";

interface OrderItemWithMeasurement {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  garmentType: string;
  quantity: number;
  deliveryDate: string | null;
}

function MeasurementStatus({ orderItemId, onNavigate }: { orderItemId: string; onNavigate: () => void }) {
  const { data: measurement, isLoading } = useMeasurementSet(orderItemId);

  if (isLoading) {
    return <Badge variant="outline">Loading...</Badge>;
  }

  if (measurement) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-success/15 text-success">
          <CheckCircle className="h-3 w-3 mr-1" />
          Measured
        </Badge>
        <Button variant="ghost" size="sm" onClick={onNavigate}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={onNavigate}>
      <Ruler className="h-4 w-4 mr-1" />
      Add Measurements
    </Button>
  );
}

export default function MeasurementsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const { data: orders = [], isLoading } = useOrders();

  // Flatten all order items from all orders
  const allOrderItems: OrderItemWithMeasurement[] = orders.flatMap((order) =>
    (order.order_items || []).map((item) => ({
      id: item.id,
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customers?.name || "Unknown",
      garmentType: item.garment_type,
      quantity: item.quantity,
      deliveryDate: order.delivery_date,
    }))
  );

  const filteredItems = allOrderItems.filter((item) => {
    const matchesSearch =
      item.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.garmentType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <AppLayout title="Measurements" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Measurements" subtitle="Manage garment measurements for order items">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Pending</Button>
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>All</Button>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2">
          <div className="rounded-lg border p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Total Items</p>
            <p className="text-lg md:text-2xl font-bold">{allOrderItems.length}</p>
          </div>
          <div className="rounded-lg border p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Orders</p>
            <p className="text-lg md:text-2xl font-bold">{orders.filter((o) => o.order_items && o.order_items.length > 0).length}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden divide-y">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No order items found</div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Button variant="link" className="p-0 h-auto text-sm" onClick={() => navigate(`/orders/${item.orderId}`)}>{item.orderNumber}</Button>
                      <p className="text-sm">{item.customerName}</p>
                    </div>
                    {item.deliveryDate && (
                      <span className="text-xs text-muted-foreground">{new Date(item.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.garmentType} x{item.quantity}</p>
                  <MeasurementStatus orderItemId={item.id} onNavigate={() => navigate(`/measurements/${item.id}`)} />
                </div>
              ))
            )}
          </div>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Garment</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Measurement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No order items found</TableCell></TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/measurements/${item.id}`)}>{item.orderNumber}</Button></TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.garmentType}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-"}</TableCell>
                      <TableCell><MeasurementStatus orderItemId={item.id} onNavigate={() => navigate(`/measurements/${item.id}`)} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
