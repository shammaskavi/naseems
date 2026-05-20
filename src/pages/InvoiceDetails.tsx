import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Download, Printer, IndianRupee, History, CheckCircle2, MessageSquare } from "lucide-react";
import { useInvoice } from "@/hooks/useInvoices";
import { usePayments, useCreatePayment } from "@/hooks/usePayments";
import { format } from "date-fns";
import Logo from "@/assets/logo.jpeg";
import LogoFull from "@/assets/logofull.png";

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

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(-num);

  let words = '';

  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num > 0) {
    if (num < 10) {
      words += ones[num];
    } else if (num < 20) {
      words += teens[num - 10];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += ' ' + ones[num % 10];
      }
    }
  }

  return words.trim();
}

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useInvoice(id);
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(id);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice?.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
            .company-info { text-align: right; }
            .company-name { font-size: 24px; font-weight: bold; color: #8B4513; }
            .tax-invoice { font-size: 14px; color: #666; margin-bottom: 10px; }
            .customer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .section-label { color: #666; font-size: 10px; margin-bottom: 4px; }
            .section-value { font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .totals-section { display: flex; justify-content: space-between; }
            .amount-words { flex: 1; padding-right: 40px; }
            .totals-table { width: 300px; }
            .totals-table td { border: 1px solid #ddd; padding: 6px 10px; }
            .totals-table .total-row { font-weight: bold; background-color: #f0f0f0; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; }
            .bank-details { font-size: 11px; }
            .signature { text-align: center; }
            .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
            @media print {
              body { padding: 0; }
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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

  const amountInWords = numberToWords(Math.round(invoice.total)) + " Rupees Only";

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
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            {invoice.status !== 'paid' && (
              <Button variant="outline" className="text-success border-success/30 hover:bg-success/5" onClick={() => setIsPaymentDialogOpen(true)}>
                <IndianRupee className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            )}
            <Button variant="outline" onClick={handleWhatsAppShare}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Invoice Section */}
          <Card className="p-0 overflow-hidden lg:col-span-3">
            <CardContent className="p-0">
              <div ref={printRef} className="invoice-container p-8 bg-white text-black min-h-[1000px]">
                {/* Header */}
                <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-4">
                  <div>
                    <img src={Logo} alt="Naseems Couture Logo" className="invoice-logo h-20 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">TAX INVOICE</p>
                    <p className="text-xs text-gray-500">E-mail: naseems.couture@gmail.com</p>
                    <p className="text-xs text-gray-500">GSTIN: 29AHBPA9932B1ZN</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-bold text-amber-800">NASEEM'S</h1>
                    <p className="text-lg text-amber-700">COUTURE</p>
                    <p className="text-xs text-gray-500 mt-1">89/1, 2nd Floor, Gandhi Bazar</p>
                    <p className="text-xs text-gray-500">Main Road Basavanagudi</p>
                    <p className="text-xs text-gray-500">Bangalore-560004. Mobile: 7019589947</p>
                  </div>
                </div>

                {/* Customer & Invoice Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">M/s.</p>
                      <p className="font-medium border-b border-gray-300 pb-1">{invoice.customers?.name || "N/A"}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="border-b border-gray-300 pb-1">{invoice.customers?.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="border-b border-gray-300 pb-1">{invoice.customers?.phone || "-"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">No.</p>
                      <p className="font-bold text-lg">{invoice.invoice_number.replace("INV-", "")}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Date</p>
                      <p>{format(new Date(invoice.invoice_date), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Order</p>
                      <p>{invoice.orders?.order_number || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-left w-12">S.NO.</th>
                      <th className="border border-gray-300 p-2 text-left">PARTICULAR</th>
                      <th className="border border-gray-300 p-2 text-center w-20">HSN CODE</th>
                      <th className="border border-gray-300 p-2 text-center w-16">QTY.</th>
                      <th className="border border-gray-300 p-2 text-right w-20">RATE</th>
                      <th className="border border-gray-300 p-2 text-right w-24">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.invoice_items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{item.description}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.hsn_code || "-"}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                        <td className="border border-gray-300 p-2 text-right">₹{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - invoice.invoice_items.length) }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td className="border border-gray-300 p-2">&nbsp;</td>
                        <td className="border border-gray-300 p-2"></td>
                        <td className="border border-gray-300 p-2"></td>
                        <td className="border border-gray-300 p-2"></td>
                        <td className="border border-gray-300 p-2"></td>
                        <td className="border border-gray-300 p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-between mb-6">
                  <div className="flex-1 pr-8">
                    <p className="text-xs text-gray-500 mb-1">Amount in words:</p>
                    <p className="font-medium text-sm">{amountInWords}</p>
                  </div>
                  <div className="w-72">
                    <table className="w-full border-collapse">
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-2">Total Amount Before GST</td>
                          <td className="border border-gray-300 p-2 text-right">₹{invoice.taxable_amount.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Add : CGST ({invoice.cgst_rate}%)</td>
                          <td className="border border-gray-300 p-2 text-right">₹{invoice.cgst_amount.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 p-2">Add : SGST ({invoice.sgst_rate}%)</td>
                          <td className="border border-gray-300 p-2 text-right">₹{invoice.sgst_amount.toLocaleString("en-IN")}</td>
                        </tr>
                        {invoice.igst_amount > 0 && (
                          <tr>
                            <td className="border border-gray-300 p-2">Add : IGST ({invoice.igst_rate}%)</td>
                            <td className="border border-gray-300 p-2 text-right">₹{invoice.igst_amount.toLocaleString("en-IN")}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="border border-gray-300 p-2">Round Off</td>
                          <td className="border border-gray-300 p-2 text-right">
                            ₹{(Math.round(invoice.total) - invoice.total).toFixed(2)}
                          </td>
                        </tr>
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-gray-300 p-2">Total Amount After GST</td>
                          <td className="border border-gray-300 p-2 text-right">₹{Math.round(invoice.total).toLocaleString("en-IN")}</td>
                        </tr>
                        {invoice.advance_paid > 0 && (
                          <>
                            <tr>
                              <td className="border border-gray-300 p-2">Advance Paid</td>
                              <td className="border border-gray-300 p-2 text-right">₹{invoice.advance_paid.toLocaleString("en-IN")}</td>
                            </tr>
                            <tr className="font-bold">
                              <td className="border border-gray-300 p-2">Balance Due</td>
                              <td className="border border-gray-300 p-2 text-right text-red-600">₹{invoice.due_amount.toLocaleString("en-IN")}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-300">
                  <div className="text-xs">
                    <p className="font-medium mb-1">Bank Details:</p>
                    <p>Bank: UNION BANK OF INDIA</p>
                    <p>Branch: Sirsi Circle, Bangalore</p>
                    <p>A/c: 039521010000015</p>
                    <p>IFSC: UBIN0903957</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-800 font-bold">For NASEEM'S</p>
                    <p className="text-amber-700">COUTURE</p>
                    <div className="mt-12 pt-2 border-t border-gray-400">
                      <p className="text-xs">Authorised Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Payment History */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="h-fit">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
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
                    payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-start border-l-2 border-success/30 pl-3 py-1">
                        <div>
                          <p className="text-sm font-semibold capitalize">{payment.payment_mode.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(payment.payment_date), "dd MMM yyyy")}</p>
                          {payment.reference_number && <p className="text-[10px] text-muted-foreground font-mono">#{payment.reference_number}</p>}
                        </div>
                        <p className="text-sm font-bold text-success">₹{payment.amount.toLocaleString("en-IN")}</p>
                      </div>
                    ))
                  )}

                  {/* Final Outstanding Status */}
                  <div className="pt-4 border-t mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase">Invoice Status</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${invoice.status === 'paid' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold">Total Due</span>
                      <span className="text-lg font-bold text-destructive">₹{invoice.due_amount.toLocaleString("en-IN")}</span>
                    </div>
                    {invoice.status === 'paid' && (
                      <div className="mt-3 p-2 bg-success/10 rounded-lg flex items-center justify-center gap-2 text-success">
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
    </AppLayout>
  );
}