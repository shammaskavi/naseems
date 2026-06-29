import React, { forwardRef } from "react";
import { format } from "date-fns";
import { Globe, Instagram, BadgeCheck } from "lucide-react";
import Logo from "@/assets/logo4.png";

export function numberToWords(num: number): string {
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

interface PremiumInvoiceTemplateProps {
    invoice: any;
}

export const PremiumInvoiceTemplate = forwardRef<HTMLDivElement, PremiumInvoiceTemplateProps>(
    ({ invoice }, ref) => {
        if (!invoice) return null;

        const amountInWords = numberToWords(Math.round(invoice.total)) + " Rupees Only";

        return (
            <div ref={ref} className="p-8 sm:p-12 bg-white text-stone-900 min-h-[1056px] min-w-[800px] w-full relative mx-auto font-sans">
                {/* Decorative Top Border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700"></div>

                {/* Header */}
                <div className="flex flex-row justify-between items-start border-b border-stone-200 pb-8 mb-8">
                    <div>
                        <img src={Logo} alt="Naseems Couture Logo" className="h-16 sm:h-20 mb-4 object-contain" />
                        <p className="text-[10px] sm:text-xs font-semibold text-stone-500 tracking-[0.2em] mb-2 uppercase">Tax Invoice</p>
                        <p className="text-[10px] sm:text-xs text-stone-500">E-mail: naseems.couture@gmail.com</p>
                        <p className="text-[10px] sm:text-xs text-stone-500 font-mono mt-1">GSTIN: 29AHBPA9932B1ZN</p>
                    </div>
                    <div className="text-right mt-0">
                        <h1 className="text-2xl sm:text-3xl font-serif text-amber-900 tracking-tight">NASEEM'S</h1>
                        <p className="text-lg sm:text-xl font-serif text-amber-700/80 mb-2">COUTURE</p>
                        <p className="text-[10px] sm:text-xs text-stone-500 leading-relaxed">
                            89/1, 2nd Floor, Gandhi Bazar<br />
                            Main Road Basavanagudi<br />
                            Bangalore - 560004<br />
                            Mobile: 7019589947<br />
                            080 43941191
                        </p>
                    </div>
                </div>

                {/* Customer & Invoice Info */}
                <div className="grid grid-cols-2 gap-8 sm:gap-12 mb-10">
                    <div>
                        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-3">Billed To</p>
                        <p className="font-serif text-base sm:text-lg text-stone-800 mb-1">{invoice.customers?.name || "N/A"}</p>
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs">{invoice.customers?.address || "-"}</p>
                        <p className="text-xs sm:text-sm text-stone-600 mt-2">Phone: {invoice.customers?.phone || "-"}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="mb-4">
                            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-1">Invoice Number</p>
                            <p className="font-mono text-sm sm:text-base text-stone-800 font-medium">{invoice.invoice_number}</p>
                        </div>
                        <div className="mb-4">
                            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-1">Date of Issue</p>
                            <p className="text-xs sm:text-sm text-stone-800">{format(new Date(invoice.invoice_date), "dd MMMM yyyy")}</p>
                        </div>
                        {invoice.orders?.order_number && (
                            <div>
                                <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-1">Order Reference</p>
                                <p className="text-xs sm:text-sm text-stone-800">{invoice.orders.order_number}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-10 rounded-sm overflow-hidden border border-stone-200">
                    <table className="w-full text-xs sm:text-sm">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-200">
                                <th className="p-3 sm:p-4 text-left font-semibold text-stone-600 w-8 sm:w-12 text-center">#</th>
                                <th className="p-3 sm:p-4 text-left font-semibold text-stone-600">Particulars</th>
                                <th className="p-3 sm:p-4 text-center font-semibold text-stone-600 w-16 sm:w-24">HSN</th>
                                <th className="p-3 sm:p-4 text-center font-semibold text-stone-600 w-12 sm:w-20">Qty</th>
                                <th className="p-3 sm:p-4 text-right font-semibold text-stone-600 w-20 sm:w-28">Rate</th>
                                <th className="p-3 sm:p-4 text-right font-semibold text-stone-600 w-24 sm:w-32">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {invoice.invoice_items?.map((item: any, index: number) => (
                                <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="p-3 sm:p-4 text-stone-500 text-center">{index + 1}</td>
                                    <td className="p-3 sm:p-4 font-medium text-stone-800">{item.description}</td>
                                    <td className="p-3 sm:p-4 text-stone-500 text-center text-[10px] sm:text-xs font-mono">998822</td>
                                    <td className="p-3 sm:p-4 text-stone-800 text-center">{item.quantity}</td>
                                    <td className="p-3 sm:p-4 text-stone-800 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                                    <td className="p-3 sm:p-4 text-stone-900 font-medium text-right">₹{item.amount.toLocaleString("en-IN")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex flex-row justify-between gap-8 mb-12">
                    <div className="flex-1">
                        <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-2">Amount in Words</p>
                        <p className="font-serif text-xs sm:text-sm text-stone-700 italic max-w-sm">{amountInWords}</p>
                    </div>

                    <div className="w-64 sm:w-80">
                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <div className="flex justify-between text-stone-600">
                                <span>Taxable Amount</span>
                                <span>₹{invoice.taxable_amount.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>CGST ({invoice.cgst_rate}%)</span>
                                <span>₹{invoice.cgst_amount.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                                <span>SGST ({invoice.sgst_rate}%)</span>
                                <span>₹{invoice.sgst_amount.toLocaleString("en-IN")}</span>
                            </div>
                            {invoice.igst_amount > 0 && (
                                <div className="flex justify-between text-stone-600">
                                    <span>IGST ({invoice.igst_rate}%)</span>
                                    <span>₹{invoice.igst_amount.toLocaleString("en-IN")}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-stone-400 text-[10px] sm:text-xs pt-2 border-t border-stone-100">
                                <span>Round Off</span>
                                <span>₹{(Math.round(invoice.total) - invoice.total).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between font-medium text-stone-900 pt-2 sm:pt-3 border-t border-stone-200">
                                <span>Grand Total</span>
                                <span>₹{Math.round(invoice.total).toLocaleString("en-IN")}</span>
                            </div>

                            {invoice.advance_paid > 0 && (
                                <>
                                    <div className="flex justify-between text-emerald-700 pt-2">
                                        <span>Advance Paid</span>
                                        <span>- ₹{invoice.advance_paid.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between font-serif text-base sm:text-lg font-medium text-amber-900 pt-3 sm:pt-4 border-t border-stone-200 mt-2">
                                        <span>Balance Due</span>
                                        <span>₹{invoice.due_amount.toLocaleString("en-IN")}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Terms & Conditions */}
                <div className="mt-8">
                    <p className="text-[10px] font-semibold text-stone-600 uppercase tracking-widest mb-2">Terms & Conditions</p>
                    <div className="text-[8px] sm:text-[9px] text-stone-500 leading-relaxed max-w-2xl space-y-1">
                        <p>No guarantee on color, fabric, or zari; dry-clean only. Goods once sold are not returnable or exchangeable. Customizations may incur extra charges. Payment is due within 30 days; overdue payments attract 18% annual interest. We are not liable for loss or damage during transit.</p>
                        <p>All disputes arising are subject to Bangalore Jurisdiction only.</p>
                        <p className="text-stone-700 font-medium pt-1">For Order Pickups & Enquiries: 080-43941191</p>
                    </div>
                </div>

                {/* Footer (Bank & Signature) */}
                <div className="mt-8 pt-8 border-t border-stone-200 flex flex-row justify-between items-end gap-8">
                    <div className="text-[10px] sm:text-xs text-stone-500 bg-stone-50 p-3 sm:p-4 rounded-sm border border-stone-100">
                        <p className="font-semibold text-stone-700 mb-2 uppercase tracking-wider text-[8px] sm:text-[10px]">Bank Transfer Details</p>
                        <div className="grid grid-cols-[50px_1fr] sm:grid-cols-[60px_1fr] gap-1">
                            <span className="text-stone-400">Bank</span>
                            <span className="font-medium text-stone-700">UNION BANK OF INDIA</span>

                            <span className="text-stone-400">Branch</span>
                            <span className="font-medium text-stone-700">Sirsi Circle, Bangalore</span>

                            <span className="text-stone-400">A/C No</span>
                            <span className="font-mono font-medium text-stone-700">039521010000015</span>

                            <span className="text-stone-400">IFSC</span>
                            <span className="font-mono font-medium text-stone-700">UBIN0903957</span>
                        </div>
                    </div>
                    <div className="text-right w-48 sm:w-56 flex flex-col items-end">
                        <p className="text-amber-900 font-serif mb-2 italic text-xs sm:text-sm">For Naseem's Couture</p>
                        <div className="bg-stone-50 border border-stone-200 p-2 sm:p-3 rounded text-left w-full relative overflow-hidden">
                            <div className="flex items-start gap-2 relative z-10">
                                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[8px] sm:text-[9px] font-semibold text-emerald-800 uppercase tracking-wider mb-0.5">Digitally Signed</p>
                                    <p className="text-[7px] sm:text-[8px] text-stone-500 font-mono">Date: {format(new Date(), "dd-MMM-yyyy")}</p>
                                    <p className="text-[7px] sm:text-[8px] text-stone-500 font-mono mt-1 leading-tight">Computer generated document, no physical signature required.</p>
                                </div>
                            </div>
                            {/* Subtle watermark background */}
                            <BadgeCheck className="w-16 h-16 text-emerald-600/5 absolute -right-2 -bottom-4 z-0" />
                        </div>
                    </div>
                </div>

                {/* Socials / Contact */}
                <div className="mt-12 pt-4 border-t border-stone-100 flex justify-center items-center gap-6 text-[9px] sm:text-[10px] text-stone-500">
                    <a href="https://www.naseemscouture.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                        <Globe className="w-3 h-3" />
                        www.naseemscouture.com
                    </a>
                    <span className="text-stone-300">|</span>
                    <a href="https://www.instagram.com/naseems.couture/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-700 transition-colors">
                        <Instagram className="w-3 h-3" />
                        @naseems.couture
                    </a>
                </div>
            </div>
        );
    }
);

PremiumInvoiceTemplate.displayName = "PremiumInvoiceTemplate";
