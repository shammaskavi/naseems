import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Copy } from "lucide-react";
import { useMeasurementSet, useCreateMeasurementSet, useUpdateMeasurementSet, useLatestCustomerMeasurement } from "@/hooks/useMeasurements";
import { useOrder, useOrderItem } from "@/hooks/useOrders"; // Import useOrder to get the customer ID
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
  const navigate = useNavigate();

  // 1. Fetch existing measurement for this item
  const { data: existingMeasurement, isLoading: isLoadingExisting } = useMeasurementSet(orderItemId);

  // 2. Fetch the order/item details to get the customer_id
  const { data: orderItemDetails, isLoading: isLoadingItem } = useOrderItem(orderItemId);
  // const customerId = orderItemDetails?.customer_id;
  // const customerId = orderItemDetails?.orders?.customer_id;
  const customerId = orderItemDetails?.customer?.id;

  // 3. Fetch latest measurements for this specific customer
  const { data: latestMeasurement } = useLatestCustomerMeasurement(customerId);

  const createMeasurement = useCreateMeasurementSet();
  const updateMeasurement = useUpdateMeasurementSet();

  const [formData, setFormData] = useState({
    shoulder: "", chest: "", mid_chest: "", stomach: "", hip_upper: "", neck: "", arm: "", elbow: "", cuff: "",
    c_front: "", c_back: "", h_back: "", sleeve: "", high_waist: "", low_waist: "", hip_lower: "", inseam: "",
    thigh: "", knee: "", calf: "", fork: "", bottom: "", fit_type: "regular" as FitType, body_posture: "", design_notes: "",
  });

  // Effect to load existing measurements if editing
  useEffect(() => {
    if (existingMeasurement) {
      setFormData({
        shoulder: existingMeasurement.shoulder?.toString() || "",
        chest: existingMeasurement.chest?.toString() || "",
        mid_chest: existingMeasurement.mid_chest?.toString() || "",
        stomach: existingMeasurement.stomach?.toString() || "",
        hip_upper: existingMeasurement.hip_upper?.toString() || "",
        neck: existingMeasurement.neck?.toString() || "",
        arm: existingMeasurement.arm?.toString() || "",
        elbow: existingMeasurement.elbow?.toString() || "",
        cuff: existingMeasurement.cuff?.toString() || "",
        c_front: existingMeasurement.c_front?.toString() || "",
        c_back: existingMeasurement.c_back?.toString() || "",
        h_back: existingMeasurement.h_back?.toString() || "",
        sleeve: existingMeasurement.sleeve?.toString() || "",
        high_waist: existingMeasurement.high_waist?.toString() || "",
        low_waist: existingMeasurement.low_waist?.toString() || "",
        hip_lower: existingMeasurement.hip_lower?.toString() || "",
        inseam: existingMeasurement.inseam?.toString() || "",
        thigh: existingMeasurement.thigh?.toString() || "",
        knee: existingMeasurement.knee?.toString() || "",
        calf: existingMeasurement.calf?.toString() || "",
        fork: existingMeasurement.fork?.toString() || "",
        bottom: existingMeasurement.bottom?.toString() || "",
        fit_type: (existingMeasurement.fit_type as FitType) || "regular",
        body_posture: existingMeasurement.body_posture || "",
        design_notes: existingMeasurement.design_notes || "",
      });
    }
  }, [existingMeasurement]);

  const handleCopyPrevious = () => {
    if (!latestMeasurement) {
      toast.error("No previous measurements found for this customer");
      return;
    }

    setFormData({
      shoulder: latestMeasurement.shoulder?.toString() || "",
      chest: latestMeasurement.chest?.toString() || "",
      mid_chest: latestMeasurement.mid_chest?.toString() || "",
      stomach: latestMeasurement.stomach?.toString() || "",
      hip_upper: latestMeasurement.hip_upper?.toString() || "",
      neck: latestMeasurement.neck?.toString() || "",
      arm: latestMeasurement.arm?.toString() || "",
      elbow: latestMeasurement.elbow?.toString() || "",
      cuff: latestMeasurement.cuff?.toString() || "",
      c_front: latestMeasurement.c_front?.toString() || "",
      c_back: latestMeasurement.c_back?.toString() || "",
      h_back: latestMeasurement.h_back?.toString() || "",
      sleeve: latestMeasurement.sleeve?.toString() || "",
      high_waist: latestMeasurement.high_waist?.toString() || "",
      low_waist: latestMeasurement.low_waist?.toString() || "",
      hip_lower: latestMeasurement.hip_lower?.toString() || "",
      inseam: latestMeasurement.inseam?.toString() || "",
      thigh: latestMeasurement.thigh?.toString() || "",
      knee: latestMeasurement.knee?.toString() || "",
      calf: latestMeasurement.calf?.toString() || "",
      fork: latestMeasurement.fork?.toString() || "",
      bottom: latestMeasurement.bottom?.toString() || "",
      fit_type: (latestMeasurement.fit_type as FitType) || "regular",
      body_posture: latestMeasurement.body_posture || "",
      design_notes: latestMeasurement.design_notes || "",
    });

    toast.success(`Loaded previous measurements for ${orderItemDetails?.customers?.name || 'customer'}`);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!orderItemId) return;

    // Convert string inputs back to numbers for the database
    const numericData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [
        k,
        v === "" ? null : (["fit_type", "body_posture", "design_notes"].includes(k) ? v : parseFloat(v as string))
      ])
    );

    const data = {
      order_item_id: orderItemId,
      measurement_profile_id: null,
      ...numericData,
      reference_images: null,
    };

    try {
      if (existingMeasurement) {
        await updateMeasurement.mutateAsync({ id: existingMeasurement.id, ...data } as any);
      } else {
        await createMeasurement.mutateAsync(data as any);
      }
      navigate(-1);
    } catch (error) {
      console.error("Failed to save measurements:", error);
    }
  };

  if (isLoadingExisting || isLoadingItem) return (
    <AppLayout title="Measurements" subtitle="Loading...">
      <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Measurements" subtitle={`Enter measurements for ${orderItemDetails?.customers?.name || 'Customer'}`}>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>

          {latestMeasurement && (
            <Button
              variant="outline"
              className="border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10"
              onClick={handleCopyPrevious}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy from Previous Order
            </Button>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Upper Body (inches)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MeasurementInput label="Shoulder" field="shoulder" value={formData.shoulder} onChange={handleInputChange} />
            <MeasurementInput label="Chest" field="chest" value={formData.chest} onChange={handleInputChange} />
            <MeasurementInput label="Mid Chest" field="mid_chest" value={formData.mid_chest} onChange={handleInputChange} />
            <MeasurementInput label="Stomach" field="stomach" value={formData.stomach} onChange={handleInputChange} />
            <MeasurementInput label="Hip" field="hip_upper" value={formData.hip_upper} onChange={handleInputChange} />
            <MeasurementInput label="Neck" field="neck" value={formData.neck} onChange={handleInputChange} />
            <MeasurementInput label="Arm" field="arm" value={formData.arm} onChange={handleInputChange} />
            <MeasurementInput label="Elbow" field="elbow" value={formData.elbow} onChange={handleInputChange} />
            <MeasurementInput label="Cuff" field="cuff" value={formData.cuff} onChange={handleInputChange} />
            <MeasurementInput label="C-Front" field="c_front" value={formData.c_front} onChange={handleInputChange} />
            <MeasurementInput label="C-Back" field="c_back" value={formData.c_back} onChange={handleInputChange} />
            <MeasurementInput label="H-Back" field="h_back" value={formData.h_back} onChange={handleInputChange} />
            <MeasurementInput label="Sleeve" field="sleeve" value={formData.sleeve} onChange={handleInputChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lower Body (inches)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MeasurementInput label="High Waist" field="high_waist" value={formData.high_waist} onChange={handleInputChange} />
            <MeasurementInput label="Low Waist" field="low_waist" value={formData.low_waist} onChange={handleInputChange} />
            <MeasurementInput label="Hip" field="hip_lower" value={formData.hip_lower} onChange={handleInputChange} />
            <MeasurementInput label="Inseam" field="inseam" value={formData.inseam} onChange={handleInputChange} />
            <MeasurementInput label="Thigh" field="thigh" value={formData.thigh} onChange={handleInputChange} />
            <MeasurementInput label="Knee" field="knee" value={formData.knee} onChange={handleInputChange} />
            <MeasurementInput label="Calf" field="calf" value={formData.calf} onChange={handleInputChange} />
            <MeasurementInput label="Fork" field="fork" value={formData.fork} onChange={handleInputChange} />
            <MeasurementInput label="Bottom" field="bottom" value={formData.bottom} onChange={handleInputChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fit & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fit Type</Label>
                <Select value={formData.fit_type} onValueChange={(v: FitType) => setFormData({ ...formData, fit_type: v })}>
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
                <Input value={formData.body_posture} onChange={(e) => setFormData({ ...formData, body_posture: e.target.value })} placeholder="Normal, Erect, Stooped" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Design Notes</Label>
              <Textarea value={formData.design_notes} onChange={(e) => setFormData({ ...formData, design_notes: e.target.value })} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSave} disabled={createMeasurement.isPending || updateMeasurement.isPending}>
            {(createMeasurement.isPending || updateMeasurement.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />Save Measurements
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}