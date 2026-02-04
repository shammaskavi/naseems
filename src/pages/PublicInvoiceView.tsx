import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, IndianRupee, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import Logo from "@/assets/logo.jpeg";

export default function PublicInvoiceView() {
    const { token } = useParams();

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

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error || !invoice) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
            <Card className="max-w-md w-full p-8">
                <h1 className="text-xl font-bold text-destructive">Invalid or Expired Link</h1>
                <p className="text-muted-foreground mt-2">This invoice link is no longer valid. Please contact Naseem's Couture for a new link.</p>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Customer Action Bar */}
            <div className="sticky top-0 z-10 bg-white border-b shadow-sm p-4 mb-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-bold uppercase">Amount Due</p>
                        <p className="text-2xl font-bold text-destructive">₹{invoice.due_amount.toLocaleString("en-IN")}</p>
                    </div>
                    {invoice.status !== 'paid' ? (
                        <Button size="lg" className="bg-success hover:bg-success/90 text-white font-bold px-8 shadow-lg transition-transform active:scale-95">
                            <IndianRupee className="h-4 w-4 mr-2" />
                            Pay Now
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-success font-bold bg-success/10 px-4 py-2 rounded-full">
                            <ShieldCheck className="h-5 w-5" />
                            Fully Paid
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4">
                <Card className="shadow-2xl border-none p-0 overflow-hidden">
                    <CardContent className="p-0">
                        {/* Standard Invoice View (Matches your internal UI) */}
                        <div className="p-8 bg-white text-black min-h-[1000px]">
                            {/* Header */}
                            <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-4">
                                <div>
                                    <img src={Logo} alt="Logo" className="h-16 mb-2" />
                                    <p className="text-sm font-medium">TAX INVOICE</p>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-tighter">GSTIN: 29AHBPA9932B1ZN</p>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-2xl font-bold text-amber-800 tracking-tighter uppercase">Naseem's Couture</h1>
                                    <p className="text-[10px] text-gray-500">89/1, 2nd Floor, Gandhi Bazar, Bangalore</p>
                                </div>
                            </div>

                            {/* Basic Details */}
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Billed To</p>
                                    <p className="font-bold text-lg">{invoice.customers?.name}</p>
                                    <p className="text-sm text-gray-600">{invoice.customers?.address || "No address provided"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Invoice No.</p>
                                    <p className="font-bold">{invoice.invoice_number}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Date</p>
                                    <p className="text-sm">{format(new Date(invoice.invoice_date), "dd MMMM yyyy")}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full border-collapse mb-8 text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border p-3 text-left">Description</th>
                                        <th className="border p-3 text-center w-16">Qty</th>
                                        <th className="border p-3 text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.invoice_items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="border p-3 font-medium">{item.description}</td>
                                            <td className="border p-3 text-center">{item.quantity}</td>
                                            <td className="border p-3 text-right">₹{item.amount.toLocaleString("en-IN")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Summary */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total Bill</span>
                                        <span className="font-medium">₹{invoice.total.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-success font-bold">
                                        <span>Paid to Date</span>
                                        <span>-₹{(invoice.total - invoice.due_amount).toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 text-lg font-bold text-destructive">
                                        <span>Balance Due</span>
                                        <span>₹{invoice.due_amount.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <p className="text-center text-xs text-muted-foreground mt-8">
                    Generated securely by <a href="https://naseemscouture.com" className="underline hover:text-primary">Naseem's Couture</a> ❤️
                </p>
            </div>
        </div>
    );
}