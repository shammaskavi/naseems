import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ArrowLeft,
    Phone,
    MapPin,
    Mail,
    Ruler,
    ShoppingBag,
    IndianRupee,
    Plus,
    ChevronRight,
    Calendar,
    Clock,
    FileText
} from "lucide-react";
import { useCustomer } from "@/hooks/useCustomers";
import { useCustomerMeasurements, useMeasurementConfig } from "@/hooks/useMeasurements";
import { useOrders } from "@/hooks/useOrders";
import { useInvoices } from "@/hooks/useInvoices";
import { useState } from "react";
import { format, isValid } from "date-fns";

// Helper to prevent "Invalid Time Value" crashes and fix "N/A" issues
const safeFormatDate = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid Date";
    return format(date, formatStr);
};

// Resilient helper to find the price in any field name
const getOrderAmount = (order: any): number => {
    if (!order) return 0;
    // Try balance first (as seen in the Orders list), then total, then total_amount
    const amount = order.balance ?? order.total ?? order.total_amount ?? order.total_price ?? 0;
    return Number(amount);
};

export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);

    // 1. Data Fetching
    const { data: customer, isLoading: customerLoading } = useCustomer(id);
    const { data: measurements = [], isLoading: measurementsLoading } = useCustomerMeasurements(id);

    const { data: allConfigs = [] } = useMeasurementConfig(); // Ensure this is imported

    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

    // 2. Filter data for this specific customer
    const customerOrders = orders.filter(o => o.customer_id === id);
    const customerInvoices = invoices.filter(inv => inv.customer_id === id);

    // 3. Financial Logic - Summing using the resilient helper
    const totalLifetimeSpend = customerOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);

    // Auto-select latest measurement for display
    if (measurements.length > 0 && !selectedMeasurement && !measurementsLoading) {
        setSelectedMeasurement(measurements[0]);
    }

    if (customerLoading || ordersLoading || invoicesLoading) {
        return (
            <AppLayout title="Customer Profile" subtitle="Syncing profile data...">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Customer Profile" subtitle={customer?.name}>
            <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">

                {/* Navigation & Quick Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate("/customers")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate(`/measurements/new?customerId=${id}`)}>
                            <Plus className="h-4 w-4 mr-2" /> New Measurement
                        </Button>
                    </div>
                </div>

                {/* Customer Info Header */}
                <Card className="bg-primary/5 border-primary/10 shadow-sm overflow-hidden">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                                    {customer?.name?.charAt(0).toUpperCase() || "C"}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">{customer?.name || "Unknown"}</h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> Member since {safeFormatDate(customer?.created_at, "MMMM yyyy")}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 p-2 rounded-md bg-white border">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <span className="font-medium">{customer?.phone || "No Phone"}</span>
                                </div>
                                {customer?.email && (
                                    <div className="flex items-center gap-2 p-2 rounded-md bg-white border">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span className="truncate max-w-[150px]">{customer.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Updated Tab Navigation */}
                <Tabs defaultValue="measurements" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                        <TabsTrigger value="measurements">Measurements</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="invoices">Invoices</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                    </TabsList>

                    {/* TAB: MEASUREMENTS */}
                    <TabsContent value="measurements" className="space-y-4 mt-4">
                        {/* Replace the content inside <TabsContent value="measurements"> */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Left Sidebar: History List */}
                            <Card className="md:col-span-1 h-fit">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                                        History
                                        <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-primary">{measurements.length}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
                                    {measurements.map((m: any) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMeasurement(m)}
                                            className={`w-full text-left p-3 rounded-md transition-all border ${selectedMeasurement?.id === m.id
                                                ? "bg-primary text-white border-primary shadow-md"
                                                : "hover:bg-muted border-transparent"
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold">{safeFormatDate(m.created_at, "dd MMM yyyy")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${selectedMeasurement?.id === m.id ? "bg-white/20" : "bg-muted-foreground/10 text-muted-foreground"
                                                    }`}>
                                                    {m.order_item_id ? "Order" : "Profile"}
                                                </span>
                                                {/* Show a preview of the main value */}
                                                <span className="text-[10px] opacity-80 italic">Chest: {m.chest || '-'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Right Content: Measurement Details */}
                            {/* Right Content: Measurement Details */}
                            <Card className="md:col-span-3">
                                <CardHeader className="border-b flex flex-row items-center justify-between py-4">
                                    <div>
                                        <CardTitle className="text-lg">Detailed Measurements</CardTitle>
                                        <p className="text-xs text-muted-foreground">Recorded on {safeFormatDate(selectedMeasurement?.created_at, "PPPP")}</p>
                                    </div>
                                    {/* {selectedMeasurement && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/measurements/${selectedMeasurement.order_item_id || 'new'}?id=${selectedMeasurement.id}&customerId=${id}`)}
                                        >
                                            Edit Record
                                        </Button>
                                    )} */}
                                </CardHeader>
                                <CardContent className="pt-6 space-y-8">
                                    {selectedMeasurement ? (
                                        <>
                                            {/* Main Measurement Grid: Two Columns for Upper/Lower Body */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {["upper_body", "lower_body"].map((cat) => {
                                                    const catConfigs = allConfigs.filter(c => c.category === cat && c.is_active);
                                                    if (catConfigs.length === 0) return null;

                                                    return (
                                                        <div key={cat} className="space-y-4">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-2 mb-4">
                                                                {cat.replace('_', ' ')}
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {catConfigs.map(config => (
                                                                    <div key={config.name} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
                                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{config.label}</p>
                                                                        <p className="text-lg font-bold text-primary">
                                                                            {selectedMeasurement[config.name] ? `${selectedMeasurement[config.name]}"` : "-"}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Fit, Posture & Notes Section (Full Width Below) */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-primary/5 rounded-xl border border-primary/10">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-wider">Style & Posture</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-xs font-medium bg-white border px-3 py-1.5 rounded-full shadow-sm capitalize">{selectedMeasurement.fit_type || 'Standard'} Fit</span>
                                                        <span className="text-xs font-medium bg-white border px-3 py-1.5 rounded-full shadow-sm">{selectedMeasurement.body_posture || 'Normal Posture'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-wider">Tailoring Notes</p>
                                                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                                                        {selectedMeasurement.design_notes || "No special design instructions recorded."}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-20">
                                            <Ruler className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                            <p className="text-muted-foreground italic text-sm">Select a measurement date from history to view details.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB: ORDERS (FIXED PRICING) */}
                    <TabsContent value="orders" className="mt-4">
                        <div className="space-y-4">
                            {customerOrders.length > 0 ? (
                                customerOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                        <div>
                                            <p className="font-bold">{order.order_number}</p>
                                            <p className="text-xs text-muted-foreground">{safeFormatDate(order.order_date || order.created_at, "dd MMM yyyy")}</p>
                                        </div>
                                        <div className="text-right">
                                            {/* Fixed: Resilient amount discovery */}
                                            <p className="font-bold text-lg text-primary">₹{getOrderAmount(order).toLocaleString("en-IN")}</p>
                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-secondary">{order.status?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-muted-foreground italic">No orders found.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* TAB: INVOICES */}
                    <TabsContent value="invoices" className="mt-4">
                        <div className="space-y-4">
                            {customerInvoices.length > 0 ? (
                                customerInvoices.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-bold">{inv.invoice_number}</p>
                                                <p className="text-[10px] text-muted-foreground">{safeFormatDate(inv.invoice_date || inv.created_at, "dd MMM yyyy")}</p>
                                            </div>
                                        </div>
                                        <div className="text-right font-bold">₹{Number(inv.total || inv.amount || 0).toLocaleString("en-IN")}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-muted-foreground italic">No invoices found.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* TAB: PAYMENTS */}
                    <TabsContent value="payments" className="mt-4">
                        <Card className="text-center py-12">
                            <IndianRupee className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                            <h3 className="text-3xl font-bold text-primary">₹{totalLifetimeSpend.toLocaleString("en-IN")}</h3>
                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mt-1">Total Lifetime Spend</p>
                            <div className="mt-8 border-t pt-6 max-w-xs mx-auto text-xs text-muted-foreground">
                                Sum of all order values linked to this account.
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}