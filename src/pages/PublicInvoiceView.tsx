import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, IndianRupee, ShieldCheck, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import Logo from "@/assets/logo.jpeg";
import { PremiumInvoiceTemplate } from "@/components/printing/PremiumInvoiceTemplate";


export default function PublicInvoiceView() {
    const { token } = useParams();
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Public fetch logic: uses the new public RLS policy
    const { data: invoice, isLoading, error } = useQuery({
        queryKey: ["public_invoice", token],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("invoices")
                .select(`
                  *,
                  customers (name, phone, address),
                  invoice_items (*)
                `)
                .eq("public_token", token)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!token,
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

    const handleCopyUpiId = () => {
        navigator.clipboard.writeText("naseems.couture@uboi");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
        </div>
    );

    if (error || !invoice) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4 text-center">
            <Card className="max-w-md w-full p-8 shadow-xl border-stone-200">
                <h1 className="text-xl font-serif text-red-800">Invalid or Expired Link</h1>
                <p className="text-stone-500 mt-2">This invoice link is no longer valid. Please contact Naseem's Couture for a new link.</p>
            </Card>
        </div>
    );

    const upiLink = `upi://pay?pa=naseems.couture@uboi&pn=Naseems%20Couture&am=${invoice.due_amount}&cu=INR`;

    return (
        <div className="min-h-screen bg-stone-100 pb-12 font-sans selection:bg-amber-100">
            {/* Customer Action Bar */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm p-4 mb-8">
                <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-widest">Amount Due</p>
                        <p className="text-lg sm:text-2xl font-serif text-stone-900">₹{invoice.due_amount.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleDownloadPDF} 
                            disabled={isDownloadingPdf}
                            className="border-stone-300 text-stone-700 hover:bg-stone-50 h-9 sm:h-11"
                        >
                            {isDownloadingPdf ? <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" /> : <Download className="h-4 w-4 sm:mr-2" />}
                            <span className="hidden sm:inline">Download PDF</span>
                        </Button>

                        {invoice.status !== 'paid' ? (
                            <Button 
                                size="sm" 
                                onClick={() => setIsPaymentDialogOpen(true)}
                                className="bg-amber-700 hover:bg-amber-800 text-white shadow-md transition-transform active:scale-95 h-9 sm:h-11"
                            >
                                <IndianRupee className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Pay via UPI</span>
                                <span className="sm:hidden">Pay</span>
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1 sm:gap-2 text-emerald-700 font-medium bg-emerald-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-emerald-100 text-xs sm:text-base">
                                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                                Paid
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 overflow-hidden">
                <Card className="shadow-2xl border-none p-0 overflow-hidden rounded-sm ring-1 ring-stone-900/5">
                    {/* The outer container handles mobile scrolling, the inner container is forced to desktop width so html2canvas captures perfectly */}
                    <CardContent className="p-0 overflow-x-auto w-full">
                        <PremiumInvoiceTemplate ref={printRef} invoice={invoice} />
                    </CardContent>
                </Card>
                
                <p className="text-center text-xs text-stone-400 mt-6 sm:mt-8 font-medium">
                    Secured by <a href="https://naseemscouture.com" className="hover:text-amber-700 transition-colors">Naseem's Couture</a>
                </p>
            </div>

            {/* Payment Modal */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-2xl text-amber-900 text-center">Scan & Pay</DialogTitle>
                        <DialogDescription className="text-center">
                            Scan this QR code from any UPI app, or copy the UPI ID to pay.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center py-4 space-y-6">
                        {/* The QR Code */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-100 ring-4 ring-stone-50">
                            <QRCodeSVG value={upiLink} size={180} />
                        </div>
                        
                        {/* Copyable UPI ID */}
                        <div className="w-full space-y-1.5">
                            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest text-center">UPI ID</p>
                            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg p-2 pl-4">
                                <span className="font-mono text-sm font-medium text-stone-700">naseems.couture@uboi</span>
                                <Button variant="ghost" size="icon" onClick={handleCopyUpiId} className="h-8 w-8 hover:bg-stone-200">
                                    {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-stone-500" />}
                                </Button>
                            </div>
                        </div>

                        <div className="w-full flex items-center gap-4">
                            <div className="h-px bg-stone-200 flex-1"></div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">OR</span>
                            <div className="h-px bg-stone-200 flex-1"></div>
                        </div>

                        {/* Direct App Link for <2000 INR */}
                        <Button asChild className="w-full bg-amber-700 hover:bg-amber-800 text-white shadow-md rounded-lg h-12">
                            <a href={upiLink}>
                                Open UPI App
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}