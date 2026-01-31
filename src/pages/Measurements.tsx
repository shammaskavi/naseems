import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Copy } from "lucide-react";
import {
  useMeasurementSet,
  useCreateMeasurementSet,
  useUpdateMeasurementSet,
  useLatestCustomerMeasurement,
  useMeasurementConfig
} from "@/hooks/useMeasurements";
import { useOrderItem } from "@/hooks/useOrders";
import { useCustomer } from "@/hooks/useCustomers";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type FitType = "regular" | "slim" | "comfort";

interface MeasurementInputProps {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
}

const MeasurementInput = ({ label, field, value, onChange }: MeasurementInputProps) => (
  <div className="space-y-1">
    <Label className="text-xs">{label}</Label>
    <Input
      type="number"
      step="0.1"
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder="0"
      className="h-9"
    />
  </div>
);

export default function Measurements() {
  const { orderItemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isNewCustomerMeasurement = orderItemId === "new";
  const urlCustomerId = searchParams.get("customerId");

  // 1. Fetch Dynamic Configuration
  const { data: config, isLoading: isLoadingConfig } = useMeasurementConfig();

  // 2. Data Fetching Hooks
  const { data: existingMeasurement, isLoading: isLoadingExisting } = useMeasurementSet(
    isNewCustomerMeasurement ? undefined : orderItemId
  );
  const { data: orderItemDetails, isLoading: isLoadingItem } = useOrderItem(
    isNewCustomerMeasurement ? undefined : orderItemId
  );
  const { data: customerDetails, isLoading: isLoadingCustomer } = useCustomer(urlCustomerId);

  const effectiveCustomerId = !isNewCustomerMeasurement ? orderItemDetails?.customer?.id : urlCustomerId;
  const customerName = !isNewCustomerMeasurement ? orderItemDetails?.customer?.name : customerDetails?.name;

  const { data: latestMeasurement } = useLatestCustomerMeasurement(effectiveCustomerId);

  const createMeasurement = useCreateMeasurementSet();
  const updateMeasurement = useUpdateMeasurementSet();

  // Use a generic record for dynamic fields
  const [formData, setFormData] = useState<Record<string, any>>({
    fit_type: "regular" as FitType,
    body_posture: "",
    design_notes: "",
  });

  // Load existing or latest data into form
  useEffect(() => {
    const dataToLoad = existingMeasurement || null;
    if (dataToLoad) {
      setFormData((prev) => ({
        ...prev,
        ...dataToLoad,
        // Ensure strings for inputs
        fit_type: dataToLoad.fit_type || "regular",
        body_posture: dataToLoad.body_posture || "",
        design_notes: dataToLoad.design_notes || "",
      }));
    }
  }, [existingMeasurement]);

  const handleCopyPrevious = () => {
    if (!latestMeasurement) {
      toast.error("No previous measurements found");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      ...latestMeasurement
    }));
    toast.success(`Loaded previous measurements for ${customerName}`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isNewCustomerMeasurement && !urlCustomerId) {
      toast.error("Missing customer association.");
      return;
    }

    // Process data: numbers for measurements, strings for notes
    const processedData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => {
        if (["fit_type", "body_posture", "design_notes"].includes(k)) return [k, v];
        return [k, v === "" ? null : parseFloat(v)];
      })
    );

    const payload = {
      order_item_id: isNewCustomerMeasurement ? null : orderItemId,
      customer_id: effectiveCustomerId,
      ...processedData,
    };

    try {
      if (existingMeasurement && !isNewCustomerMeasurement) {
        await updateMeasurement.mutateAsync({ id: existingMeasurement.id, ...payload } as any);
      } else {
        await createMeasurement.mutateAsync(payload as any);
      }
      navigate(-1);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  if (isLoadingExisting || isLoadingItem || isLoadingCustomer || isLoadingConfig) {
    return (
      <AppLayout title="Measurements" subtitle="Loading Configuration...">
        <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  // Filter config by categories
  const upperBodyFields = config?.filter(f => f.category === 'upper_body') || [];
  const lowerBodyFields = config?.filter(f => f.category === 'lower_body') || [];

  return (
    <AppLayout title="Measurements" subtitle={`Tailoring Profile: ${customerName || 'Customer'}`}>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>

          {latestMeasurement && (
            <Button variant="outline" className="border-dashed border-primary/50 bg-primary/5" onClick={handleCopyPrevious}>
              <Copy className="h-4 w-4 mr-2" /> Copy Previous
            </Button>
          )}
        </div>

        {/* Dynamic Upper Body Section */}
        {upperBodyFields.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Upper Body (inches)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {upperBodyFields.map((field) => (
                <MeasurementInput
                  key={field.name}
                  label={field.label}
                  field={field.name}
                  value={formData[field.name]?.toString() || ""}
                  onChange={handleInputChange}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dynamic Lower Body Section */}
        {lowerBodyFields.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Lower Body (inches)</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {lowerBodyFields.map((field) => (
                <MeasurementInput
                  key={field.name}
                  label={field.label}
                  field={field.name}
                  value={formData[field.name]?.toString() || ""}
                  onChange={handleInputChange}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Fit & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fit Type</Label>
                <Select value={formData.fit_type} onValueChange={(v) => handleInputChange("fit_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="slim">Slim</SelectItem>
                    <SelectItem value="comfort">Comfort</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Body Posture</Label>
                <Input value={formData.body_posture} onChange={(e) => handleInputChange("body_posture", e.target.value)} placeholder="Normal, Erect, Stooped" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Design Notes</Label>
              <Textarea value={formData.design_notes} onChange={(e) => handleInputChange("design_notes", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMeasurement.isPending || updateMeasurement.isPending}>
            {(createMeasurement.isPending || updateMeasurement.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />Save
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}