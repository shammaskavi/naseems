import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Ruler, FileText, Calendar, User, CheckCircle2 } from "lucide-react";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { useCreateInvoiceFromOrder, useInvoices } from "@/hooks/useInvoices";
import { useMeasurementSet } from "@/hooks/useMeasurements";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// 1. Aligned with public.orders SQL schema status check constraints
const statusConfig = {
  created: { label: "Created", className: "bg-muted text-muted-foreground" },
  measurement_pending: { label: "Measurement Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
  in_production: { label: "In Production", className: "bg-blue-100 text-blue-700 border-blue-200" },
  ready: { label: "Ready for Pickup", className: "bg-green-100 text-green-700 border-green-200" },
  delivered: { label: "Delivered", className: "bg-slate-100 text-slate-700 border-slate-200" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground" },
};

function OrderItemCard({ item }: { item: any }) {
  const navigate = useNavigate();
  const { data: measurement } = useMeasurementSet(item.id);

  return (
    <Card className="border-muted/60 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="font-bold text-lg">{item.garment_type}</p>
            <p className="text-sm font-medium">Qty: {item.quantity} • <span className="text-primary">₹{item.total_price.toLocaleString("en-IN")}</span></p>
            {item.fabric_name && <p className="text-xs text-muted-foreground">Fabric: {item.fabric_name}</p>}
            {item.addons && <p className="text-xs text-muted-foreground italic">Add-ons: {item.addons}</p>}
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge variant={measurement ? "default" : "outline"} className={cn(measurement ? "bg-green-500" : "text-muted-foreground")}>
              {measurement ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Measured</> : "No Measurements"}
            </Badge>
            <Button size="sm" variant="outline" className="h-8" onClick={() => navigate(`/measurements/${item.id}`)}>
              <Ruler className="h-3.5 w-3.5 mr-1.5" />
              {measurement ? "Review" : "Add Measurements"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data Fetching
  const { data: order, isLoading: orderLoading } = useOrder(id);
  // Fetch invoices for this specific order to prevent duplicates
  const { data: invoices } = useInvoices();
  const existingInvoice = invoices?.find(inv => inv.order_id === id);

  const updateStatus = useUpdateOrderStatus();
  const createInvoice = useCreateInvoiceFromOrder();

  const handleGenerateInvoice = async () => {
    if (!order || existingInvoice) return;
    try {
      await createInvoice.mutateAsync({
        orderId: order.id,
        advancePaid: order.advance_amount || 0
      });
      navigate("/invoices");
    } catch (error) {
      console.error("Invoice generation failed:", error);
    }
  };

  if (orderLoading) {
    return (
      <AppLayout title="Order Details" subtitle="Syncing with workshop...">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading order details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout title="Order Not Found" subtitle="">
        <div className="text-center py-20">
          <p className="text-xl font-semibold mb-2">Order not found</p>
          <p className="text-muted-foreground mb-6">The order record might have been moved or deleted.</p>
          <Button onClick={() => navigate("/orders")}><ArrowLeft className="mr-2 h-4 w-4" /> Return to Orders</Button>
        </div>
      </AppLayout>
    );
  }

  const statusKey = order.status as keyof typeof statusConfig;
  const status = statusConfig[statusKey] || statusConfig.created;
  const isMeasurementPending = order.order_items?.some(item => !item.has_measurements) || order.status === 'measurement_pending';

  return (
    <AppLayout title={order.order_number} subtitle={`Customer: ${order.customers?.name}`}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/orders"><ArrowLeft className="h-4 w-4 mr-2" />Back to List</Link>
          </Button>
          <div className="flex gap-2">
            <Badge className={cn("px-3 py-1", status.className)}>{status.label}</Badge>
            {order.priority && <Badge variant="destructive" className="animate-pulse">Priority</Badge>}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-primary/[0.02]">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg"><User className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Customer</p>
                <p className="font-semibold text-lg">{order.customers?.name}</p>
                <p className="text-sm text-muted-foreground">{order.customers?.phone}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Expected Delivery</p>
                <p className="font-semibold text-lg">
                  {order.delivery_date ? format(new Date(order.delivery_date), "do MMM yyyy") : "TBD"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 bg-green-50 rounded-lg"><FileText className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Order Status</p>
                <p className="font-semibold text-lg">{status.label}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Item List */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Ruler className="h-4 w-4" /> Garments & Measurements
            </h3>
            {order.order_items?.map((item) => (
              <OrderItemCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pricing & Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">Pricing Summary</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span>₹{order.tax_amount.toLocaleString("en-IN")}</span>
                </div>
                {order.advance_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Advance Deposit</span>
                    <span>-₹{order.advance_amount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-3 border-t">
                  <span>Due Total</span>
                  <span className="text-primary">₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button className="w-full" variant="outline" onClick={() => navigate("/jobs")}>
                Workshop Status
              </Button>

              {existingInvoice ? (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate(`/invoices/${existingInvoice.id}`)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> View Invoice
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleGenerateInvoice}
                  disabled={createInvoice.isPending || isMeasurementPending}
                >
                  {createInvoice.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  {isMeasurementPending ? "Awaiting Measurements" : "Generate Invoice"}
                </Button>
              )}
              {isMeasurementPending && (
                <p className="text-[10px] text-center text-muted-foreground">Invoice cannot be generated until all items are measured.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}