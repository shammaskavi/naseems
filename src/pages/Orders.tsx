import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Eye,
  Ruler,
  Scissors,
  Receipt,
  CheckCircle,
  Package,
  AlertTriangle,
  Calendar,
  Phone,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/types";
import { useOrders, useUpdateOrderStatus, OrderWithDetails } from "@/hooks/useOrders";
import { useCreateInvoiceFromOrder } from "@/hooks/useInvoices";

const statusConfig: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  created: { label: "Created", icon: Package, className: "bg-muted text-muted-foreground" },
  measurement_pending: { label: "Measurement Pending", icon: Ruler, className: "bg-warning/15 text-warning" },
  in_production: { label: "In Production", icon: Scissors, className: "bg-info/15 text-info" },
  ready: { label: "Ready", icon: CheckCircle, className: "bg-success/15 text-success" },
  delivered: { label: "Delivered", icon: Package, className: "bg-primary/15 text-primary" },
  closed: { label: "Closed", icon: CheckCircle, className: "bg-muted text-muted-foreground" },
};

// Mobile Order Card Component
function OrderCard({ order, onGenerateInvoice, updateStatus, navigate }: {
  order: OrderWithDetails;
  onGenerateInvoice: (order: OrderWithDetails) => void;
  updateStatus: ReturnType<typeof useUpdateOrderStatus>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const status = statusConfig[order.status as OrderStatus] || statusConfig.created;
  const StatusIcon = status.icon;
  const daysUntilDelivery = (date: string | null) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };
  const days = daysUntilDelivery(order.delivery_date);
  const isOverdue = days !== null && days < 0 && order.status !== "delivered" && order.status !== "closed";
  const isDueSoon = days !== null && days >= 0 && days <= 2 && order.status !== "delivered" && order.status !== "closed";
  const dueAmount = (order.total || 0) - (order.advance_amount || 0);
  const items = order.order_items?.map((i) => 
    i.quantity > 1 ? `${i.garment_type} (${i.quantity})` : i.garment_type
  ).join(", ") || "No items";

  return (
    <div className="p-4 border-b border-border last:border-b-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{order.order_number}</span>
            {order.priority && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Priority
              </Badge>
            )}
          </div>
          {order.quotations && (
            <p className="text-xs text-muted-foreground">from {order.quotations.quotation_number}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/orders/${order.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            {order.status === "measurement_pending" && order.order_items?.[0] && (
              <DropdownMenuItem asChild>
                <Link to={`/measurements/${order.order_items[0].id}`}>
                  <Ruler className="h-4 w-4 mr-2" />
                  Add Measurements
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate("/jobs")}>
              <Scissors className="h-4 w-4 mr-2" />
              View Job Cards
            </DropdownMenuItem>
            {(order.status === "ready" || order.status === "delivered") && (
              <DropdownMenuItem onClick={() => onGenerateInvoice(order)}>
                <Receipt className="h-4 w-4 mr-2" />
                Generate Invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {order.status === "measurement_pending" && (
              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "in_production" })}>
                <Scissors className="h-4 w-4 mr-2" />
                Start Production
              </DropdownMenuItem>
            )}
            {order.status === "in_production" && (
              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "ready" })} className="text-success">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Ready
              </DropdownMenuItem>
            )}
            {order.status === "ready" && (
              <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "delivered" })} className="text-success">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Delivered
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{order.customers?.name || "Unknown"}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {order.customers?.phone || "N/A"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{items}</p>
        
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <span className={cn("status-badge inline-flex items-center gap-1 text-xs", status.className)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            {order.delivery_date && (
              <div className="flex items-center gap-1">
                <Calendar className={cn("h-3 w-3", isOverdue ? "text-destructive" : isDueSoon ? "text-warning" : "text-muted-foreground")} />
                <span className={cn("text-xs", isOverdue && "text-destructive font-medium")}>
                  {new Date(order.delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
            )}
            {dueAmount > 0 ? (
              <span className="font-semibold text-destructive">₹{dueAmount.toLocaleString("en-IN")}</span>
            ) : (
              <span className="text-success font-medium text-xs">Paid</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const createInvoice = useCreateInvoiceFromOrder();

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.customers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customers?.phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && (o.status === "created" || o.status === "measurement_pending");
    if (activeTab === "production") return matchesSearch && o.status === "in_production";
    if (activeTab === "ready") return matchesSearch && o.status === "ready";
    if (activeTab === "completed") return matchesSearch && (o.status === "delivered" || o.status === "closed");
    return matchesSearch;
  });

  const daysUntilDelivery = (date: string | null) => {
    if (!date) return null;
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleGenerateInvoice = async (order: OrderWithDetails) => {
    await createInvoice.mutateAsync({ orderId: order.id, advancePaid: order.advance_amount || 0 });
    navigate("/invoices");
  };

  if (isLoading) {
    return (
      <AppLayout title="Orders" subtitle="Track and manage customer orders">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Orders" subtitle="Track and manage customer orders">
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">In Production</p>
            <p className="text-xl md:text-2xl font-bold font-display text-info">
              {orders.filter((o) => o.status === "in_production").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Ready for Pickup</p>
            <p className="text-xl md:text-2xl font-bold font-display text-success">
              {orders.filter((o) => o.status === "ready").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Due This Week</p>
            <p className="text-xl md:text-2xl font-bold font-display text-warning">
              {orders.filter((o) => {
                const days = daysUntilDelivery(o.delivery_date);
                return days !== null && days <= 7 && days >= 0;
              }).length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Pending Dues</p>
            <p className="text-xl md:text-2xl font-bold font-display text-destructive">
              ₹{orders.reduce((sum, o) => sum + ((o.total || 0) - (o.advance_amount || 0)), 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Tabs & Table */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 w-full overflow-x-auto flex-nowrap justify-start">
            <TabsTrigger value="all" className="text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs md:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="production" className="text-xs md:text-sm">In Production</TabsTrigger>
            <TabsTrigger value="ready" className="text-xs md:text-sm">Ready</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs md:text-sm">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Mobile View - Card Layout */}
              <div className="md:hidden">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onGenerateInvoice={handleGenerateInvoice}
                      updateStatus={updateStatus}
                      navigate={navigate}
                    />
                  ))
                )}
              </div>

              {/* Desktop View - Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const status = statusConfig[order.status as OrderStatus] || statusConfig.created;
                      const StatusIcon = status.icon;
                      const days = daysUntilDelivery(order.delivery_date);
                      const isOverdue = days !== null && days < 0 && order.status !== "delivered" && order.status !== "closed";
                      const isDueSoon = days !== null && days >= 0 && days <= 2 && order.status !== "delivered" && order.status !== "closed";
                      const dueAmount = (order.total || 0) - (order.advance_amount || 0);
                      const items = order.order_items?.map((i) => 
                        i.quantity > 1 ? `${i.garment_type} (${i.quantity})` : i.garment_type
                      ).join(", ") || "No items";

                      return (
                        <TableRow key={order.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{order.order_number}</p>
                                  {order.priority && (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      Priority
                                    </Badge>
                                  )}
                                </div>
                                {order.quotations && (
                                  <p className="text-xs text-muted-foreground">
                                    from {order.quotations.quotation_number}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customers?.name || "Unknown"}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {order.customers?.phone || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{items}</p>
                              {order.tailor_name && (
                                <p className="text-xs text-muted-foreground">
                                  {order.tailor_name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.delivery_date ? (
                              <div className="flex items-center gap-2">
                                <Calendar className={cn("h-4 w-4", isOverdue ? "text-destructive" : isDueSoon ? "text-warning" : "text-muted-foreground")} />
                                <div>
                                  <p className={cn("text-sm", isOverdue && "text-destructive font-medium")}>
                                    {new Date(order.delivery_date).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </p>
                                  {isOverdue ? (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {Math.abs(days!)} days overdue
                                    </p>
                                  ) : days === 0 ? (
                                    <p className="text-xs text-warning">Due today</p>
                                  ) : days !== null && days > 0 && order.status !== "delivered" && (
                                    <p className="text-xs text-muted-foreground">{days} days left</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn("status-badge inline-flex items-center gap-1.5", status.className)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {dueAmount > 0 ? (
                              <span className="font-semibold text-destructive">
                                ₹{dueAmount.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-success font-medium">Paid</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/orders/${order.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {order.status === "measurement_pending" && order.order_items?.[0] && (
                                  <DropdownMenuItem asChild>
                                    <Link to={`/measurements/${order.order_items[0].id}`}>
                                      <Ruler className="h-4 w-4 mr-2" />
                                      Add Measurements
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate("/jobs")}>
                                  <Scissors className="h-4 w-4 mr-2" />
                                  View Job Cards
                                </DropdownMenuItem>
                                {(order.status === "ready" || order.status === "delivered") && (
                                  <DropdownMenuItem onClick={() => handleGenerateInvoice(order)}>
                                    <Receipt className="h-4 w-4 mr-2" />
                                    Generate Invoice
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {order.status === "measurement_pending" && (
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "in_production" })}>
                                    <Scissors className="h-4 w-4 mr-2" />
                                    Start Production
                                  </DropdownMenuItem>
                                )}
                                {order.status === "in_production" && (
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "ready" })} className="text-success">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Ready
                                  </DropdownMenuItem>
                                )}
                                {order.status === "ready" && (
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: order.id, status: "delivered" })} className="text-success">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Delivered
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
