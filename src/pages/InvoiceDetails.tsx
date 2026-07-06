import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Download, Printer, IndianRupee, History, CheckCircle2, MessageSquare, Tag } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useReactToPrint } from "react-to-print";
import { useInvoice, useApplyInvoiceDiscount } from "@/hooks/useInvoices";
import { usePayments, useCreatePayment } from "@/hooks/usePayments";
import { format } from "date-fns";
import { PremiumInvoiceTemplate } from "@/components/printing/PremiumInvoiceTemplate";

function DiscountDialog({ invoice, open, onOpenChange }: { invoice: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const applyDiscount = useApplyInvoiceDiscount();
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    if (invoice && open) {
      setDiscountAmount(invoice.discount_amount || 0);
    }
  }, [invoice, open]);

  const handleSave = async () => {
    if (!invoice) return;
    await applyDiscount.mutateAsync({
      id: invoice.id,
      discountAmount: Number(discountAmount),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Discount to {invoice?.invoice_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Discount Amount (₹)</Label>
            <Input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">This will reduce the taxable amount and recalculate GST.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={applyDiscount.isPending}>
            {applyDiscount.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Payment Dialog Component locally defined for use within InvoiceDetails
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

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(id);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoice?.invoice_number ? `Invoice_${invoice.invoice_number}` : 'Invoice',
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current || !invoice) return;
    try {
      setIsDownloadingPdf(true);
      const element = printRef.current;

      // Render at higher scale for better quality
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Convert canvas px to mm (assuming 96 DPI)
      const mmPerPx = 25.4 / 96;
      const imgWidthMm = canvas.width * mmPerPx;
      const imgHeightMm = canvas.height * mmPerPx;

      // Leave small margins
      const margin = 10; // mm
      const maxWidth = pdfWidth - margin * 2;
      const maxHeight = pdfHeight - margin * 2;

      // Scale to fit within max area without cropping
      const scale = Math.min(maxWidth / imgWidthMm, maxHeight / imgHeightMm, 1);
      const renderWidth = imgWidthMm * scale;
      const renderHeight = imgHeightMm * scale;

      const x = (pdfWidth - renderWidth) / 2;
      const y = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
      pdf.save(`${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (invoiceLoading || paymentsLoading) {
    return (
      <AppLayout title="Invoice" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoice" subtitle="Not found">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
          <Button variant="outline" onClick={() => navigate("/invoices")} className="mt-4">
            Back to Invoices
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleWhatsAppShare = () => {
    if (!invoice) return;

    // Use the current window origin to ensure the link works in both dev and prod
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/public/invoice/${invoice.public_token}`;

    const message = `Hi ${invoice.customers?.name},\n\nYour invoice ${invoice.invoice_number} from Naseem's Couture is ready.\nYou can view the details and pay online here:\n${publicUrl}\n\nThank you!`;

    const encodedMessage = encodeURIComponent(message);
    // Remove spaces from phone number for the wa.me link
    const cleanPhone = invoice.customers?.phone?.replace(/\s+/g, '');
    const whatsappUrl = `https://wa.me/+91${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <AppLayout title="Invoice Details" subtitle={invoice.invoice_number}>
      <div className="space-y-4 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/invoices")} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handlePrint}>
              <Printer className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            {invoice.status !== 'paid' && invoice.due_amount > 0 && (
              <Button variant="outline" className="flex-1 sm:flex-none text-blue-700 border-blue-700/30 hover:bg-blue-50" onClick={() => setIsDiscountDialogOpen(true)}>
                <Tag className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Discount</span>
                <span className="sm:hidden">Disc</span>
              </Button>
            )}
            {invoice.status !== 'paid' && (
              <Button variant="outline" className="flex-1 sm:flex-none text-emerald-700 border-emerald-700/30 hover:bg-emerald-50" onClick={() => setIsPaymentDialogOpen(true)}>
                <IndianRupee className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Record Payment</span>
                <span className="sm:hidden">Pay</span>
              </Button>
            )}
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleDownloadPDF} disabled={isDownloadingPdf}>
              {isDownloadingPdf ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Download className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleWhatsAppShare}>
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Invoice Section */}
          <Card className="p-0 overflow-hidden lg:col-span-3 shadow-lg border-none ring-1 ring-stone-900/5">
            <CardContent className="p-0 overflow-x-auto w-full">
              {/* Added a bg-stone-100 wrapper so the white template stands out on the dashboard */}
              <div className="bg-stone-50 p-4 sm:p-8 flex justify-center w-full">
                <PremiumInvoiceTemplate ref={printRef} invoice={invoice} />
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Payment History */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-fit">
              <CardHeader className="pb-3 border-b border-stone-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-stone-700">
                  <History className="h-4 w-4" /> Payment History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Initial Advance Display */}
                  {invoice.advance_paid > 0 && (
                    <div className="flex justify-between items-start border-l-2 border-primary/30 pl-3 py-1">
                      <div>
                        <p className="text-sm font-semibold">Advance Payment</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(invoice.invoice_date), "dd MMM yyyy")}</p>
                      </div>
                      <p className="text-sm font-bold">₹{invoice.advance_paid.toLocaleString("en-IN")}</p>
                    </div>
                  )}

                  {/* List of Payments */}
                  {payments.length === 0 && invoice.advance_paid === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No payments recorded yet</p>
                  ) : (
                    payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-start border-l-2 border-emerald-500/30 pl-3 py-1">
                        <div>
                          <p className="text-sm font-semibold capitalize">{payment.payment_mode.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(payment.payment_date), "dd MMM yyyy")}</p>
                          {payment.reference_number && <p className="text-[10px] text-muted-foreground font-mono">#{payment.reference_number}</p>}
                        </div>
                        <p className="text-sm font-bold text-emerald-700">₹{payment.amount.toLocaleString("en-IN")}</p>
                      </div>
                    ))
                  )}

                  {/* Final Outstanding Status */}
                  <div className="pt-4 border-t border-stone-100 mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Invoice Status</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-bold text-stone-700">Total Due</span>
                      <span className="text-lg font-bold text-red-600">₹{invoice.due_amount.toLocaleString("en-IN")}</span>
                    </div>
                    {invoice.status === 'paid' && (
                      <div className="mt-3 p-2 bg-emerald-50 rounded-lg flex items-center justify-center gap-2 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-bold italic tracking-tight">Fully Settled</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PaymentDialog
        invoice={invoice}
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
      />
      <DiscountDialog
        invoice={invoice}
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
      />
    </AppLayout>
  );
}