import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MeasurementProfile {
  id: string;
  customer_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeasurementSet {
  id: string;
  order_item_id: string | null;
  customer_id: string | null;
  measurement_profile_id: string | null;
  fit_type: "regular" | "slim" | "comfort";
  body_posture: string | null;
  design_notes: string | null;
  reference_images: string[] | null;
  metadata?: Record<string, any>; // The new flexible storage
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allows dynamic access to flattened fields like .shoulder
}

// 1. Hook to fetch the Dynamic Configuration from Settings
// Inside src/hooks/useMeasurements.ts
export function useMeasurementConfig(onlyActive = false) {
  return useQuery({
    queryKey: ["measurement_config", onlyActive],
    queryFn: async () => {
      let query = supabase
        .from("measurement_configs")
        .select("*")
        .order("sort_order", { ascending: true });

      if (onlyActive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// 2. Fetch a specific set (with flattening logic to prevent breaking UI)
export function useMeasurementSet(orderItemId: string | undefined) {
  return useQuery({
    queryKey: ["measurement_sets", orderItemId],
    enabled: !!orderItemId && orderItemId !== "new",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("order_item_id", orderItemId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Merge metadata fields back to the top level so formData.shoulder still works
      return { ...data, ...data.metadata } as MeasurementSet;
    },
  });
}

// 3. Create Hook (Strategically saves numeric fields into metadata)
export function useCreateMeasurementSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurementData: any) => {
      // Destructure standard columns from dynamic measurement values
      const {
        customer_id,
        order_item_id,
        measurement_profile_id,
        fit_type,
        body_posture,
        design_notes,
        reference_images,
        ...dynamicValues
      } = measurementData;

      const { data, error } = await supabase
        .from("measurement_sets")
        .insert([{
          customer_id,
          order_item_id,
          measurement_profile_id,
          fit_type,
          body_posture,
          design_notes,
          reference_images,
          metadata: dynamicValues // Industry-standard: store measurements here
        }])
        .select()
        .single();

      if (error) throw error;

      if (order_item_id) {
        await checkAndUpdateOrderStatus(order_item_id);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["measurement_sets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_measurements_history", data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["latest_measurement", data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Measurements saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save measurements: ${error.message}`);
    },
  });
}

// 4. Update Hook (Maintains dynamic field support)
export function useUpdateMeasurementSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...measurementData }: any) => {
      const {
        customer_id,
        order_item_id,
        measurement_profile_id,
        fit_type,
        body_posture,
        design_notes,
        reference_images,
        metadata, // Ignore existing metadata field if passed
        ...dynamicValues
      } = measurementData;

      const { data, error } = await supabase
        .from("measurement_sets")
        .update({
          fit_type,
          body_posture,
          design_notes,
          reference_images,
          metadata: dynamicValues // Overwrite metadata with current form values
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["measurement_sets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_measurements_history", data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["latest_measurement", data.customer_id] });
      toast.success("Measurements updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// 5. History and Latest hooks (With flattening)
export function useCustomerMeasurements(customerId?: string) {
  return useQuery({
    queryKey: ["customer_measurements_history", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(m => ({ ...m, ...m.metadata })) as MeasurementSet[];
    },
  });
}

export function useLatestCustomerMeasurement(customerId: string | undefined) {
  return useQuery({
    queryKey: ["latest_measurement", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return { ...data, ...data.metadata } as MeasurementSet;
    },
  });
}

// Helper: Auto-update order status
async function checkAndUpdateOrderStatus(orderItemId: string) {
  const { data: orderItem } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("id", orderItemId)
    .single();

  if (!orderItem) return;

  const { data: allItems } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderItem.order_id);

  if (!allItems || allItems.length === 0) return;

  const { data: measurements } = await supabase
    .from("measurement_sets")
    .select("order_item_id")
    .in("order_item_id", allItems.map((i) => i.id));

  const allMeasured = measurements && measurements.length >= allItems.length;

  if (allMeasured) {
    await supabase
      .from("orders")
      .update({ status: "in_production" })
      .eq("id", orderItem.order_id)
      .eq("status", "measurement_pending");
  }
}