-- Create workers/tailors table
CREATE TABLE
  public.workers (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    specialization TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT now (),
      updated_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT now ()
  );

-- Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Staff can view workers" ON public.workers FOR
SELECT
  USING (is_staff ());

CREATE POLICY "Staff can create workers" ON public.workers FOR INSERT
WITH
  CHECK (is_staff ());

CREATE POLICY "Staff can update workers" ON public.workers FOR
UPDATE USING (is_staff ());

CREATE POLICY "Owner can delete workers" ON public.workers FOR DELETE USING (is_owner ());

-- Update trigger for updated_at
CREATE TRIGGER update_workers_updated_at BEFORE
UPDATE ON public.workers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column ();

-- Modify invoices to support multiple orders via junction table
CREATE TABLE
  public.invoice_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid () PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices (id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders (id),
    created_at TIMESTAMP
    WITH
      TIME ZONE NOT NULL DEFAULT now (),
      UNIQUE (invoice_id, order_id)
  );

-- Enable RLS on invoice_orders
ALTER TABLE public.invoice_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view invoice_orders" ON public.invoice_orders FOR
SELECT
  USING (is_staff ());

CREATE POLICY "Staff can create invoice_orders" ON public.invoice_orders FOR INSERT
WITH
  CHECK (is_staff ());

CREATE POLICY "Staff can update invoice_orders" ON public.invoice_orders FOR
UPDATE USING (is_staff ());

CREATE POLICY "Owner can delete invoice_orders" ON public.invoice_orders FOR DELETE USING (is_owner ());

-- Make invoices.order_id nullable (for multi-order invoices, we'll use junction table)
ALTER TABLE public.invoices
ALTER COLUMN order_id
DROP NOT NULL;