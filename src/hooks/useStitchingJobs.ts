import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StitchingJob {
  id: string;
  order_item_id: string;
  order_id: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "on_hold";
  tailor_name: string | null;
  notes: string | null;
  printed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StitchingJobWithDetails extends StitchingJob {
  orders: {
    id: string;
    order_number: string;
    delivery_date: string | null;
    priority: boolean;
    customers: {
      id: string;
      name: string;
      phone: string;
    } | null;
  } | null;
  order_items: {
    id: string;
    garment_type: string;
    fabric_name: string | null;
    quantity: number;
    notes: string | null;
  } | null;
}

export function useStitchingJobs() {
  return useQuery({
    queryKey: ["stitching_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stitching_jobs")
        .select(`
          *,
          orders (
            id, 
            order_number, 
            delivery_date, 
            priority,
            customers (id, name, phone)
          ),
          order_items (id, garment_type, fabric_name, quantity, notes)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StitchingJobWithDetails[];
    },
  });
}

export function useStitchingJob(id: string | undefined) {
  return useQuery({
    queryKey: ["stitching_jobs", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("stitching_jobs")
        .select(`
          *,
          orders (
            id, 
            order_number, 
            delivery_date, 
            priority,
            customers (id, name, phone, address)
          ),
          order_items (*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as StitchingJobWithDetails;
    },
    enabled: !!id,
  });
}

export function useUpdateStitchingJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...job }: Partial<StitchingJob> & { id: string }) => {
      const { data, error } = await supabase
        .from("stitching_jobs")
        .update(job)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stitching_jobs"] });
      toast.success("Job updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });
}

export function useMarkJobPrinted() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stitching_jobs")
        .update({ printed_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stitching_jobs"] });
      toast.success("Job marked as printed");
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark job: ${error.message}`);
    },
  });
}
