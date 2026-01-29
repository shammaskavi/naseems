-- ============================================
-- TAILORING MANAGEMENT SYSTEM DATABASE SCHEMA
-- ============================================

-- 1. BASE TABLES FIRST
-- ============================================

-- Profiles table (links to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table (lightweight catalog)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_stitching_price DECIMAL(10,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. HELPER FUNCTIONS (after profiles table exists)
-- ============================================

-- Get user role from profiles
CREATE OR REPLACE FUNCTION public.get_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'owner'
  );
$$;

-- Check if user is staff (includes owner)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'staff')
  );
$$;

-- 3. QUOTATION TABLES
-- ============================================

CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'revised', 'approved', 'locked', 'expired')),
  version INTEGER NOT NULL DEFAULT 1,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  garment_type TEXT NOT NULL,
  fabric_name TEXT,
  stitching_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  design_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
  addons TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ORDER TABLES
-- ============================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  quotation_id UUID REFERENCES public.quotations(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'measurement_pending', 'in_production', 'ready', 'delivered', 'closed')),
  delivery_date DATE,
  tailor_name TEXT,
  priority BOOLEAN NOT NULL DEFAULT false,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  quotation_item_id UUID REFERENCES public.quotation_items(id),
  product_id UUID REFERENCES public.products(id),
  garment_type TEXT NOT NULL,
  fabric_name TEXT,
  stitching_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  design_charges DECIMAL(10,2) NOT NULL DEFAULT 0,
  addons TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. MEASUREMENT TABLES
-- ============================================

CREATE TABLE public.measurement_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.measurement_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  measurement_profile_id UUID REFERENCES public.measurement_profiles(id),
  shoulder DECIMAL(5,2),
  chest DECIMAL(5,2),
  mid_chest DECIMAL(5,2),
  stomach DECIMAL(5,2),
  hip_upper DECIMAL(5,2),
  neck DECIMAL(5,2),
  arm DECIMAL(5,2),
  elbow DECIMAL(5,2),
  cuff DECIMAL(5,2),
  c_front DECIMAL(5,2),
  c_back DECIMAL(5,2),
  h_back DECIMAL(5,2),
  sleeve DECIMAL(5,2),
  high_waist DECIMAL(5,2),
  low_waist DECIMAL(5,2),
  hip_lower DECIMAL(5,2),
  inseam DECIMAL(5,2),
  thigh DECIMAL(5,2),
  knee DECIMAL(5,2),
  calf DECIMAL(5,2),
  fork DECIMAL(5,2),
  bottom DECIMAL(5,2),
  fit_type TEXT DEFAULT 'regular' CHECK (fit_type IN ('regular', 'slim', 'comfort')),
  body_posture TEXT,
  design_notes TEXT,
  reference_images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. STITCHING JOBS TABLE
-- ============================================

CREATE TABLE public.stitching_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'on_hold')),
  tailor_name TEXT,
  notes TEXT,
  printed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INVOICE TABLES
-- ============================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxable_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst_rate DECIMAL(5,2) DEFAULT 0,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_rate DECIMAL(5,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_rate DECIMAL(5,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  advance_paid DECIMAL(10,2) DEFAULT 0,
  due_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  description TEXT NOT NULL,
  hsn_code TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PAYMENTS TABLE
-- ============================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES public.invoices(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_mode TEXT NOT NULL DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  notes TEXT,
  received_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurement_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stitching_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 10. RLS POLICIES
-- ============================================

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Owner can manage profiles" ON public.profiles FOR ALL USING (public.is_owner());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Staff can view customers" ON public.customers FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create customers" ON public.customers FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update customers" ON public.customers FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete customers" ON public.customers FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view products" ON public.products FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create products" ON public.products FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update products" ON public.products FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete products" ON public.products FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view quotations" ON public.quotations FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create quotations" ON public.quotations FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update quotations" ON public.quotations FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete quotations" ON public.quotations FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view quotation items" ON public.quotation_items FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create quotation items" ON public.quotation_items FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update quotation items" ON public.quotation_items FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete quotation items" ON public.quotation_items FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create orders" ON public.orders FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete orders" ON public.orders FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view order items" ON public.order_items FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create order items" ON public.order_items FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update order items" ON public.order_items FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete order items" ON public.order_items FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view measurement profiles" ON public.measurement_profiles FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create measurement profiles" ON public.measurement_profiles FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update measurement profiles" ON public.measurement_profiles FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete measurement profiles" ON public.measurement_profiles FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view measurement sets" ON public.measurement_sets FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create measurement sets" ON public.measurement_sets FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update measurement sets" ON public.measurement_sets FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete measurement sets" ON public.measurement_sets FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view stitching jobs" ON public.stitching_jobs FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create stitching jobs" ON public.stitching_jobs FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update stitching jobs" ON public.stitching_jobs FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete stitching jobs" ON public.stitching_jobs FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view invoices" ON public.invoices FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create invoices" ON public.invoices FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update invoices" ON public.invoices FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete invoices" ON public.invoices FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view invoice items" ON public.invoice_items FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create invoice items" ON public.invoice_items FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update invoice items" ON public.invoice_items FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete invoice items" ON public.invoice_items FOR DELETE USING (public.is_owner());

CREATE POLICY "Staff can view payments" ON public.payments FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff can create payments" ON public.payments FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "Staff can update payments" ON public.payments FOR UPDATE USING (public.is_staff());
CREATE POLICY "Owner can delete payments" ON public.payments FOR DELETE USING (public.is_owner());

-- 11. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurement_profiles_updated_at BEFORE UPDATE ON public.measurement_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_measurement_sets_updated_at BEFORE UPDATE ON public.measurement_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stitching_jobs_updated_at BEFORE UPDATE ON public.stitching_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. SEQUENCE GENERATORS FOR NUMBERS
-- ============================================

CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('quotation_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 13. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_quotations_customer_id ON public.quotations(customer_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_stitching_jobs_order_id ON public.stitching_jobs(order_id);
CREATE INDEX idx_stitching_jobs_status ON public.stitching_jobs(status);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);

-- 14. STORAGE BUCKET FOR REFERENCE IMAGES
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('measurements', 'measurements', false);

CREATE POLICY "Staff can view measurement images" ON storage.objects FOR SELECT USING (bucket_id = 'measurements' AND public.is_staff());
CREATE POLICY "Staff can upload measurement images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'measurements' AND public.is_staff());
CREATE POLICY "Staff can update measurement images" ON storage.objects FOR UPDATE USING (bucket_id = 'measurements' AND public.is_staff());
CREATE POLICY "Owner can delete measurement images" ON storage.objects FOR DELETE USING (bucket_id = 'measurements' AND public.is_owner());

-- 15. TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();