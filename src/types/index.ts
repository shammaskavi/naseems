// Core Types for SilaiTrack Tailoring Management System

// ============ USER & AUTH ============
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'staff';
  createdAt: Date;
}

// ============ CUSTOMER ============
export interface Customer {
  id: string;
  name: string;
  phone: string; // unique
  email?: string;
  address?: string;
  notes?: string;
  dueBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ PRODUCTS ============
export interface Product {
  id: string;
  name: string;
  category: string;
  baseStitchingPrice?: number;
  isActive: boolean;
  createdAt: Date;
}

// ============ QUOTATION ============
export type QuotationStatus = 'draft' | 'sent' | 'revised' | 'approved' | 'locked' | 'expired';

export interface QuotationItem {
  id: string;
  quotationId: string;
  garmentType: string;
  fabricMaterial?: string;
  stitchingCost: number;
  designCharges: number;
  addOns: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: Customer;
  items: QuotationItem[];
  status: QuotationStatus;
  version: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  notes?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============ ORDER ============
export type OrderStatus = 'created' | 'measurement_pending' | 'in_production' | 'ready' | 'delivered' | 'closed';

export interface OrderItem {
  id: string;
  orderId: string;
  garmentType: string;
  fabricMaterial?: string;
  stitchingCost: number;
  designCharges: number;
  addOns: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  measurementSetId?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  quotationId: string;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  status: OrderStatus;
  deliveryDate: Date;
  tailorName?: string;
  isPriority: boolean;
  advanceAmount: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  dueAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ MEASUREMENTS ============
export type FitType = 'regular' | 'slim' | 'comfort';
export type BodyPosture = 'normal' | 'erect' | 'stooped' | 'forward_shoulder';

export interface MeasurementSet {
  id: string;
  customerId: string;
  profileName: string;
  dateTaken: Date;
  
  // Upper Body
  shoulder?: number;
  chest?: number;
  midChest?: number;
  stomach?: number;
  hip?: number;
  neck?: number;
  arm?: number;
  elbow?: number;
  cuff?: number;
  cFront?: number;
  cBack?: number;
  hBack?: number;
  sleeve?: number;
  
  // Lower Body
  highWaist?: number;
  lowWaist?: number;
  lowerHip?: number;
  inseam?: number;
  thigh?: number;
  knee?: number;
  calf?: number;
  fork?: number;
  bottom?: number;
  
  // Fit & Posture
  fitType: FitType;
  bodyPosture: BodyPosture;
  
  // Additional
  designNotes?: string;
  referenceImages?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementProfile {
  id: string;
  customerId: string;
  name: string;
  isDefault: boolean;
  measurements: MeasurementSet;
  createdAt: Date;
}

// ============ STITCHING JOB ============
export interface StitchingJob {
  id: string;
  orderId: string;
  orderItemId: string;
  order?: Order;
  customerName: string;
  garmentType: string;
  fabricInfo?: string;
  measurements: MeasurementSet;
  designNotes?: string;
  designImages?: string[];
  deliveryDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

// ============ INVOICE ============
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order?: Order;
  customerId: string;
  customer?: Customer;
  items: InvoiceItem[];
  
  // GST Details
  placeOfSupply: string;
  isInterState: boolean;
  
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalAmount: number;
  amountInWords: string;
  
  // Payment tracking
  advancePaid: number;
  balanceDue: number;
  
  invoiceDate: Date;
  dueDate?: Date;
  isPaid: boolean;
  createdAt: Date;
}

// ============ PAYMENTS ============
export type PaymentMode = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';

export interface Payment {
  id: string;
  orderId: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
  isAdvance: boolean;
  createdAt: Date;
}

// ============ DASHBOARD STATS ============
export interface DashboardStats {
  todayOrders: number;
  pendingDeliveries: number;
  totalDues: number;
  monthlyRevenue: number;
  recentOrders: Order[];
  upcomingDeliveries: Order[];
}
