import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  order_item_id: string | null;
  description: string;
  hsn_code: string | null;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  invoice_date: string;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
  advance_paid: number;
  due_amount: number;
  status: "unpaid" | "partial" | "paid";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
  } | null;
  orders: {
    id: string;
    order_number: string;
  } | null;
  invoice_items: InvoiceItem[];
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customers (id, name, phone, email, address),
          orders (id, order_number),
          invoice_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InvoiceWithDetails[];
    },
  });
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customers (id, name, phone, email, address),
          orders (id, order_number),
          invoice_items (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as InvoiceWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateInvoiceFromOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, advancePaid = 0 }: { orderId: string; advancePaid?: number }) => {
      // Fetch order with items
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("id", orderId)
        .single();

      if (fetchError) throw fetchError;

      // Generate invoice number
      const { data: invoiceNumber, error: numError } = await supabase
        .rpc("generate_invoice_number");

      if (numError) throw numError;

      const taxableAmount = order.subtotal;
      const cgstRate = 2.5;
      const sgstRate = 2.5;
      const cgstAmount = taxableAmount * (cgstRate / 100);
      const sgstAmount = taxableAmount * (sgstRate / 100);
      const total = taxableAmount + cgstAmount + sgstAmount;
      const dueAmount = total - advancePaid;

      // Create invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          order_id: orderId,
          customer_id: order.customer_id,
          subtotal: order.subtotal,
          discount_amount: 0,
          taxable_amount: taxableAmount,
          cgst_rate: cgstRate,
          cgst_amount: cgstAmount,
          sgst_rate: sgstRate,
          sgst_amount: sgstAmount,
          igst_rate: 0,
          igst_amount: 0,
          total,
          advance_paid: advancePaid,
          due_amount: dueAmount,
          status: dueAmount <= 0 ? "paid" : advancePaid > 0 ? "partial" : "unpaid",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items from order items
      const invoiceItems = order.order_items.map((oi: any) => ({
        invoice_id: newInvoice.id,
        order_item_id: oi.id,
        description: `${oi.garment_type}${oi.fabric_name ? ` - ${oi.fabric_name}` : ""}`,
        quantity: oi.quantity,
        rate: oi.unit_price,
        amount: oi.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Also insert into invoice_orders junction table
      await supabase.from("invoice_orders").insert({ invoice_id: newInvoice.id, order_id: orderId });

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

export function useCreateMultiOrderInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderIds, customerId, advancePaid = 0 }: { orderIds: string[]; customerId: string; advancePaid?: number }) => {
      // Fetch all orders with items
      const { data: ordersData, error: fetchError } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .in("id", orderIds);

      if (fetchError) throw fetchError;
      if (!ordersData || ordersData.length === 0) throw new Error("No orders found");

      // Generate invoice number
      const { data: invoiceNumber, error: numError } = await supabase.rpc("generate_invoice_number");
      if (numError) throw numError;

      // Calculate totals across all orders
      const subtotal = ordersData.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const taxableAmount = subtotal;
      const cgstRate = 9;
      const sgstRate = 9;
      const cgstAmount = taxableAmount * (cgstRate / 100);
      const sgstAmount = taxableAmount * (sgstRate / 100);
      const total = taxableAmount + cgstAmount + sgstAmount;
      const dueAmount = total - advancePaid;

      // Create invoice (order_id null for multi-order)
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          order_id: orderIds[0], // Keep first order for backward compatibility
          customer_id: customerId,
          subtotal,
          discount_amount: 0,
          taxable_amount: taxableAmount,
          cgst_rate: cgstRate,
          cgst_amount: cgstAmount,
          sgst_rate: sgstRate,
          sgst_amount: sgstAmount,
          igst_rate: 0,
          igst_amount: 0,
          total,
          advance_paid: advancePaid,
          due_amount: dueAmount,
          status: dueAmount <= 0 ? "paid" : advancePaid > 0 ? "partial" : "unpaid",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items from all order items
      const invoiceItems = ordersData.flatMap((order) =>
        (order.order_items || []).map((oi: any) => ({
          invoice_id: newInvoice.id,
          order_item_id: oi.id,
          description: `${oi.garment_type}${oi.fabric_name ? ` - ${oi.fabric_name}` : ""}`,
          quantity: oi.quantity,
          rate: oi.unit_price,
          amount: oi.total_price,
        }))
      );

      if (invoiceItems.length > 0) {
        const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
        if (itemsError) throw itemsError;
      }

      // Insert into invoice_orders junction table
      const invoiceOrders = orderIds.map((orderId) => ({ invoice_id: newInvoice.id, order_id: orderId }));
      await supabase.from("invoice_orders").insert(invoiceOrders);

      return newInvoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Multi-order invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, dueAmount }: { id: string; status: Invoice["status"]; dueAmount?: number }) => {
      const updateData: Partial<Invoice> = { status };
      if (typeof dueAmount === 'number') {
        updateData.due_amount = dueAmount;
      }

      const { error } = await supabase
        .from("invoices")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}
