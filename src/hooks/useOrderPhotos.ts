import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToGoogleDrive, deleteFromGoogleDrive } from "@/lib/googleDriveService";
import { toast } from "sonner";

export type PhotoCategory = "reference" | "fabric" | "sample" | "finished" | "other";

export interface OrderPhoto {
  id: string;
  order_id: string;
  order_item_id: string | null;
  drive_file_id: string;
  file_name: string;
  category: PhotoCategory;
  view_url: string;
  thumbnail_url: string;
  direct_url: string | null;
  notes: string | null;
  file_size_kb: number | null;
  created_at: string;
  updated_at?: string;
}

export function useOrderPhotos(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order_photos", orderId],
    queryFn: async () => {
      if (!orderId) return [];

      const { data, error } = await supabase
        .from("order_photos" as any)
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch order photos:", error);
        throw error;
      }

      return (data || []) as OrderPhoto[];
    },
    enabled: Boolean(orderId),
  });
}

export interface AddPhotoPayload {
  orderId: string;
  orderNumber: string;
  file: File;
  category?: PhotoCategory;
  notes?: string;
  orderItemId?: string | null;
}

export function useAddOrderPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddPhotoPayload) => {
      // 1. Upload to Google Drive
      const driveResult = await uploadToGoogleDrive({
        file: payload.file,
        orderNumber: payload.orderNumber,
      });

      // 2. Save metadata to Supabase DB (0 bytes file storage used)
      const insertData: Record<string, any> = {
        order_id: payload.orderId,
        drive_file_id: driveResult.fileId,
        file_name: driveResult.fileName,
        category: payload.category || "reference",
        view_url: driveResult.viewUrl,
        thumbnail_url: driveResult.thumbnailUrl,
        direct_url: driveResult.directUrl,
        notes: payload.notes || null,
        file_size_kb: driveResult.fileSizeKb,
      };

      if (payload.orderItemId) {
        insertData.order_item_id = payload.orderItemId;
      }

      const { data, error } = await supabase
        .from("order_photos" as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Rollback Google Drive upload if database insert fails
        await deleteFromGoogleDrive(driveResult.fileId);
        throw error;
      }

      return data as OrderPhoto;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order_photos", variables.orderId] });
      toast.success("Photo saved to order!");
    },
    onError: (error: Error) => {
      console.error("Photo upload failed:", error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useDeleteOrderPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoId,
      driveFileId,
      orderId,
    }: {
      photoId: string;
      driveFileId: string;
      orderId: string;
    }) => {
      // 1. Delete from database
      const { error } = await supabase
        .from("order_photos" as any)
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      // 2. Delete from Google Drive in background
      await deleteFromGoogleDrive(driveFileId);

      return { photoId, orderId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["order_photos", result.orderId] });
      toast.success("Photo removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete photo: ${error.message}`);
    },
  });
}
