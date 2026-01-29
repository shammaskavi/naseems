import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Payment {
    id: string;
    order_id: string;
    invoice_id: string | null;
    amount: number;
    payment_mode: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
    payment_date: string;
    reference_number: string | null;
    notes: string | null;
    received_by: string | null;
    created_at: string;
}

export function usePayments(invoiceId?: string) {
    return useQuery({
        queryKey: ["payments", invoiceId],
        queryFn: async () => {
            let query = supabase
                .from("payments")
                .select("*")
                .order("created_at", { ascending: false });

            if (invoiceId) {
                query = query.eq("invoice_id", invoiceId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as Payment[];
        },
    });
}

export function useCreatePayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payment: Omit<Payment, "id" | "created_at" | "received_by">) => {
            // 1. Insert the payment record
            const { data, error: paymentError } = await supabase
                .from("payments")
                .insert(payment)
                .select()
                .single();

            if (paymentError) throw paymentError;

            // Note: We rely on the database trigger 'tr_on_payment_received' 
            // to automatically update the invoice due_amount and status.

            return data;
        },
        onSuccess: (data) => {
            // Invalidate all related financial queries
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard_stats"] });
            toast.success("Payment recorded successfully");
        },
        onError: (error: Error) => {
            toast.error(`Failed to record payment: ${error.message}`);
        },
    });
}