import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { useInvoices, useCreateMultiOrderInvoice } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";

export default function CreateMultiOrderInvoice() {
  const navigate = useNavigate();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const createMultiOrderInvoice = useCreateMultiOrderInvoice();

  // Get order IDs that already have invoices
  const ordersWithInvoice = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.order_id) set.add(inv.order_id);
    });
    return set;
  }, [invoices]);

  // Filter orders by selected customer and without existing invoice
  const availableOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!selectedCustomerId) return false;
      if (order.customer_id !== selectedCustomerId) return false;
      if (ordersWithInvoice.has(order.id)) return false;
      // Only allow orders that are at least in production or beyond
      return ["in_production", "ready", "delivered", "closed"].includes(order.status);
    });
  }, [orders, selectedCustomerId, ordersWithInvoice]);

  // Calculate totals from selected orders
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const totals = useMemo(() => {
    const subtotal = selectedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const taxableAmount = subtotal;
    const cgstRate = 2.5;
    const sgstRate = 2.5;
    const cgstAmount = taxableAmount * (cgstRate / 100);
    const sgstAmount = taxableAmount * (sgstRate / 100);
    const total = taxableAmount + cgstAmount + sgstAmount;
    const totalAdvance = selectedOrders.reduce((sum, o) => sum + (o.advance_amount || 0), 0);
    const dueAmount = total - totalAdvance - advancePaid;

    return { subtotal, taxableAmount, cgstRate, cgstAmount, sgstRate, sgstAmount, total, totalAdvance, dueAmount };
  }, [selectedOrders, advancePaid]);

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleCreateInvoice = async () => {
    if (selectedOrderIds.length === 0) return;

    await createMultiOrderInvoice.mutateAsync({
      orderIds: selectedOrderIds,
      customerId: selectedCustomerId,
      advancePaid: totals.totalAdvance + advancePaid,
    });

    navigate("/invoices");
  };

  const isLoading = ordersLoading || invoicesLoading || customersLoading;

  if (isLoading) {
    return (
      <AppLayout title="Create Invoice" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Create Invoice" subtitle="Create invoice for multiple orders">
      <div className="space-y-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCustomerId} onValueChange={(v) => { setSelectedCustomerId(v); setSelectedOrderIds([]); }}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedCustomerId && (
          <Card>
            <CardHeader>
              <CardTitle>Select Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Only orders without existing invoices are shown
              </p>
            </CardHeader>
            <CardContent>
              {availableOrders.length === 0 ? (
                <p className="text-muted-foreground py-4">
                  No orders available for invoicing for this customer.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Advance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={() => handleToggleOrder(order.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {order.order_items?.map((i) => i.garment_type).join(", ") || "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(order.total || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{(order.advance_amount || 0).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {selectedOrderIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Subtotal:</div>
                <div className="text-right">₹{totals.subtotal.toLocaleString("en-IN")}</div>

                <div>CGST ({totals.cgstRate}%):</div>
                <div className="text-right">₹{totals.cgstAmount.toLocaleString("en-IN")}</div>

                <div>SGST ({totals.sgstRate}%):</div>
                <div className="text-right">₹{totals.sgstAmount.toLocaleString("en-IN")}</div>

                <div className="font-bold">Total:</div>
                <div className="text-right font-bold">₹{totals.total.toLocaleString("en-IN")}</div>

                <div>Advance from Orders:</div>
                <div className="text-right">₹{totals.totalAdvance.toLocaleString("en-IN")}</div>
              </div>

              <div className="pt-4 border-t">
                <Label>Additional Advance Payment (optional)</Label>
                <Input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="mt-2 max-w-xs"
                />
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div>
                  <span className="font-bold text-lg">Due Amount: </span>
                  <span className={`font-bold text-lg ${totals.dueAmount > 0 ? "text-destructive" : "text-success"}`}>
                    ₹{totals.dueAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <Button onClick={handleCreateInvoice} disabled={createMultiOrderInvoice.isPending}>
                  {createMultiOrderInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
