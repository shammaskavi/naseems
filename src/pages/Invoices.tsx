import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Eye, Loader2, FileDown, Plus, IndianRupee } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useCreatePayment } from "@/hooks/usePayments";
import { cn } from "@/lib/utils";

const statusConfig = {
  unpaid: { label: "Unpaid", className: "bg-destructive/15 text-destructive" },
  partial: { label: "Partial", className: "bg-warning/15 text-warning" },
  paid: { label: "Paid", className: "bg-success/15 text-success" },
};

// Payment Dialog Sub-component
function PaymentDialog({ invoice, open, onOpenChange }: { invoice: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const createPayment = useCreatePayment();
  const [formData, setFormData] = useState({
    amount: 0,
    payment_mode: "cash" as const,
    reference_number: "",
    notes: ""
  });

  useEffect(() => {
    if (invoice) {
      setFormData(prev => ({ ...prev, amount: invoice.due_amount }));
    }
  }, [invoice]);

  const handleSave = async () => {
    if (!invoice) return;
    await createPayment.mutateAsync({
      invoice_id: invoice.id,
      order_id: invoice.order_id,
      amount: Number(formData.amount),
      payment_mode: formData.payment_mode,
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: formData.reference_number || null,
      notes: formData.notes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment for {invoice?.invoice_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Current due: ₹{invoice?.due_amount.toLocaleString("en-IN")}</p>
          </div>
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select
              value={formData.payment_mode}
              onValueChange={(v: any) => setFormData({ ...formData, payment_mode: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI / PhonePe / GPay</SelectItem>
                <SelectItem value="card">Credit/Debit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference (Optional)</Label>
            <Input
              placeholder="UPI Transaction ID or Cheque No."
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createPayment.isPending}>
            {createPayment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Invoices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const { data: invoices = [], isLoading } = useInvoices();

  const filteredInvoices = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <AppLayout title="Invoices" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Invoices" subtitle="GST compliant invoices">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => navigate("/invoices/new")} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-lg border p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Total</p>
            <p className="text-lg md:text-2xl font-bold">{invoices.length}</p>
          </div>
          <div className="rounded-lg border p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Unpaid</p>
            <p className="text-lg md:text-2xl font-bold text-destructive">{invoices.filter((i) => i.status === "unpaid").length}</p>
          </div>
          <div className="rounded-lg border p-3 md:p-4">
            <p className="text-xs md:text-sm text-muted-foreground">Due</p>
            <p className="text-lg md:text-2xl font-bold text-warning">₹{invoices.reduce((sum, i) => sum + i.due_amount, 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden divide-y">
            {filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No invoices found</div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-xs", statusConfig[invoice.status]?.className)}>{statusConfig[invoice.status]?.label}</span>
                  </div>
                  <p className="text-sm mb-2">{invoice.customers?.name}</p>
                  <div className="flex justify-between text-sm">
                    <span>Total: ₹{invoice.total.toLocaleString("en-IN")}</span>
                    <span className={invoice.due_amount > 0 ? "text-destructive font-semibold" : "text-success"}>Due: ₹{invoice.due_amount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No invoices found</TableCell></TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                      <TableCell><p className="font-medium">{invoice.invoice_number}</p><p className="text-xs text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString("en-IN")}</p></TableCell>
                      <TableCell>{invoice.customers?.name}</TableCell>
                      <TableCell>{invoice.orders?.order_number}</TableCell>
                      <TableCell className="text-right font-semibold">₹{invoice.total.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right"><span className={invoice.due_amount > 0 ? "text-destructive font-semibold" : "text-success"}>₹{invoice.due_amount.toLocaleString("en-IN")}</span></TableCell>
                      <TableCell><span className={cn("px-2 py-1 rounded-full text-xs", statusConfig[invoice.status]?.className)}>{statusConfig[invoice.status]?.label}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}>
                              <FileDown className="h-4 w-4 mr-2" />Download PDF
                            </DropdownMenuItem>
                            {invoice.status !== 'paid' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedInvoiceForPayment(invoice); }}>
                                <IndianRupee className="h-4 w-4 mr-2" /> Record Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Payment Dialog Integration */}
      <PaymentDialog
        invoice={selectedInvoiceForPayment}
        open={!!selectedInvoiceForPayment}
        onOpenChange={(open) => !open && setSelectedInvoiceForPayment(null)}
      />
    </AppLayout>
  );
}