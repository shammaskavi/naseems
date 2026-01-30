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
import { useCustomerMeasurements } from "@/hooks/useMeasurements";
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-1">
                                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold uppercase tracking-wider">History</CardTitle></CardHeader>
                                <CardContent className="space-y-2 max-h-[450px] overflow-y-auto">
                                    {measurements.length > 0 ? (
                                        measurements.map((m: any) => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMeasurement(m)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedMeasurement?.id === m.id ? "bg-primary/10 border-primary" : "hover:bg-muted border-transparent"
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold">{safeFormatDate(m.created_at, "dd MMM yyyy")}</span>
                                                    <ChevronRight className={`h-3 w-3 ${selectedMeasurement?.id === m.id ? "text-primary" : "text-muted-foreground"}`} />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1 uppercase">
                                                    {m.order_item_id ? "Order-Linked" : "Profile update"}
                                                </p>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-center py-10 text-muted-foreground text-sm italic">No history found.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader className="border-b pb-4">
                                    <CardTitle className="text-lg">Values: {selectedMeasurement ? safeFormatDate(selectedMeasurement.created_at, "dd MMM yyyy") : "Select Record"}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {selectedMeasurement ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[
                                                    { label: "Chest", val: selectedMeasurement.chest },
                                                    { label: "Shoulder", val: selectedMeasurement.shoulder },
                                                    { label: "Waist", val: selectedMeasurement.low_waist },
                                                    { label: "Sleeve", val: selectedMeasurement.sleeve },
                                                    { label: "Neck", val: selectedMeasurement.neck },
                                                    { label: "Hip", val: selectedMeasurement.hip_lower }
                                                ].map(item => (
                                                    <div key={item.label} className="p-3 border rounded-lg bg-muted/20">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">{item.label}</p>
                                                        <p className="text-xl font-bold">{item.val || "-"}"</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedMeasurement.design_notes && (
                                                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Tailoring Notes</p>
                                                    <p className="text-sm italic">"{selectedMeasurement.design_notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 text-muted-foreground italic">Select a date to view.</div>
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