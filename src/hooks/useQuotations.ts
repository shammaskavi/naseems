import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QuotationItem {
  id: string;
  quotation_id: string;
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

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  status: "draft" | "sent" | "revised" | "approved" | "locked" | "expired";
  version: number;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  valid_until: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationWithDetails extends Quotation {
  customers: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  } | null;
  quotation_items: QuotationItem[];
}

export function useQuotations() {
  return useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          customers (id, name, phone, email),
          quotation_items (*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as QuotationWithDetails[];
    },
  });
}

export function useQuotation(id: string | undefined) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          customers (id, name, phone, email, address),
          quotation_items (*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as QuotationWithDetails;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      quotation, 
      items 
    }: { 
      quotation: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at">;
      items: Omit<QuotationItem, "id" | "quotation_id" | "created_at">[];
    }) => {
      // Generate quotation number
      const { data: quotationNumber, error: numError } = await supabase
        .rpc("generate_quotation_number");
      
      if (numError) throw numError;
      
      // Create quotation
      const { data: newQuotation, error: quotationError } = await supabase
        .from("quotations")
        .insert({ ...quotation, quotation_number: quotationNumber })
        .select()
        .single();
      
      if (quotationError) throw quotationError;
      
      // Create items
      if (items.length > 0) {
        const itemsWithQuotationId = items.map(item => ({
          ...item,
          quotation_id: newQuotation.id,
        }));
        
        const { error: itemsError } = await supabase
          .from("quotation_items")
          .insert(itemsWithQuotationId);
        
        if (itemsError) throw itemsError;
      }
      
      return newQuotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create quotation: ${error.message}`);
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      quotation, 
      items 
    }: { 
      id: string;
      quotation: Partial<Quotation>;
      items?: Omit<QuotationItem, "id" | "quotation_id" | "created_at">[];
    }) => {
      // Update quotation
      const { error: quotationError } = await supabase
        .from("quotations")
        .update(quotation)
        .eq("id", id);
      
      if (quotationError) throw quotationError;
      
      // If items provided, replace all items
      if (items) {
        // Delete existing items
        await supabase.from("quotation_items").delete().eq("quotation_id", id);
        
        // Insert new items
        if (items.length > 0) {
          const itemsWithQuotationId = items.map(item => ({
            ...item,
            quotation_id: id,
          }));
          
          const { error: itemsError } = await supabase
            .from("quotation_items")
            .insert(itemsWithQuotationId);
          
          if (itemsError) throw itemsError;
        }
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
}

export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Quotation["status"] }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success(`Quotation marked as ${data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
