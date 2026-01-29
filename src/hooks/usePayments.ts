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

export interface PaymentWithDetails extends Payment {
  orders: {
    id: string;
    order_number: string;
    customers: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
  invoices: {
    id: string;
    invoice_number: string;
  } | null;
}

export function usePayments(orderId?: string) {
  return useQuery({
    queryKey: ["payments", orderId],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          orders (
            id, 
            order_number,
            customers (id, name, phone)
          ),
          invoices (id, invoice_number)
        `)
        .order("payment_date", { ascending: false });
      
      if (orderId) {
        query = query.eq("order_id", orderId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as PaymentWithDetails[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payment: Omit<Payment, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(payment)
        .select()
        .single();
      
      if (error) throw error;
      
      // If linked to an invoice, update the invoice status
      if (payment.invoice_id) {
        const { data: invoice } = await supabase
          .from("invoices")
          .select("due_amount, total")
          .eq("id", payment.invoice_id)
          .single();
        
        if (invoice) {
          const newDueAmount = invoice.due_amount - payment.amount;
          const newStatus = newDueAmount <= 0 ? "paid" : "partial";
          
          await supabase
            .from("invoices")
            .update({ 
              due_amount: Math.max(0, newDueAmount),
              status: newStatus,
              advance_paid: invoice.total - Math.max(0, newDueAmount)
            })
            .eq("id", payment.invoice_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}
