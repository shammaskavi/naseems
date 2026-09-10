-- Migration: Create order_photos table for Google Drive-backed order attachments

CREATE TABLE IF NOT EXISTS public.order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  drive_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'reference' CHECK (category IN ('reference', 'fabric', 'sample', 'finished', 'other')),
  view_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  direct_url TEXT,
  notes TEXT,
  file_size_kb INTEGER,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON public.order_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_order_photos_category ON public.order_photos(category);

-- Enable Row Level Security
ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies matching application security model
CREATE POLICY "Staff can view order photos" ON public.order_photos
  FOR SELECT USING (is_staff());

CREATE POLICY "Staff can insert order photos" ON public.order_photos
  FOR INSERT WITH CHECK (is_staff());

CREATE POLICY "Staff can update order photos" ON public.order_photos
  FOR UPDATE USING (is_staff());

CREATE POLICY "Staff can delete order photos" ON public.order_photos
  FOR DELETE USING (is_staff());
