import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrderItem {
  id: string;
  order_id: string;
  quotation_item_id: string | null;
  product_id: string | null;
  garment_type: string;
  fabric_name: string | null;
  stitching_cost: number;
  design_charges: number;
  addons: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  quotation_id: string | null;
  customer_id: string;
  status: "created" | "measurement_pending" | "in_production" | "ready" | "delivered" | "closed";
  delivery_date: string | null;
  tailor_name: string | null;
  priority: boolean;
  advance_amount: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  quotations: {
    id: string;
    quotation_number: string;
  } | null;
  order_items: OrderItem[];
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (id, name, phone, email),
          quotations (id, quotation_number),
          order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as OrderWithDetails[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (id, name, phone, email, address),
          quotations (id, quotation_number),
          order_items (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as OrderWithDetails;
    },
    enabled: !!id,
  });
}


// Add this to useOrders.ts
export function useOrderItem(orderItemId: string | undefined) {
  return useQuery({
    queryKey: ["order_item_details", orderItemId],
    queryFn: async () => {
      if (!orderItemId) return null;
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          orders!inner (
            *,
            customers (id, name, phone, email, address)
          )
        `)
        .eq("id", orderItemId)
        .single();

      if (error) throw error;

      // We return the customer data at the top level so the UI doesn't break
      return {
        ...data,
        customer: data.orders?.customers
      };
    },
    enabled: !!orderItemId,
  });
}

export function useCreateOrderFromQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Fetch quotation with items
      const { data: quotation, error: fetchError } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_items (*)
        `)
        .eq("id", quotationId)
        .single();

      if (fetchError) throw fetchError;

      // Generate order number
      const { data: orderNumber, error: numError } = await supabase
        .rpc("generate_order_number");

      if (numError) throw numError;

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          quotation_id: quotationId,
          customer_id: quotation.customer_id,
          status: "measurement_pending",
          subtotal: quotation.subtotal,
          tax_amount: quotation.tax_amount,
          total: quotation.total,
          advance_amount: 0,
          priority: false,
          notes: quotation.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items from quotation items
      const orderItems = quotation.quotation_items.map((qi: any) => ({
        order_id: newOrder.id,
        quotation_item_id: qi.id,
        product_id: qi.product_id,
        garment_type: qi.garment_type,
        fabric_name: qi.fabric_name,
        stitching_cost: qi.stitching_cost,
        design_charges: qi.design_charges,
        addons: qi.addons,
        quantity: qi.quantity,
        unit_price: qi.unit_price,
        total_price: qi.total_price,
        notes: qi.notes,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update quotation status to locked
      await supabase
        .from("quotations")
        .update({ status: "locked" })
        .eq("id", quotationId);

      // Create stitching jobs for each order item
      const { data: createdItems, error: getItemsError } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", newOrder.id);

      if (!getItemsError && createdItems) {
        const stitchingJobs = createdItems.map((item: any) => ({
          order_id: newOrder.id,
          order_item_id: item.id,
          status: "pending",
        }));

        await supabase.from("stitching_jobs").insert(stitchingJobs);
      }

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Order created successfully from quotation");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`Order marked as ${data.status.replace("_", " ")}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...order }: Partial<Order> & { id: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update(order)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
}
