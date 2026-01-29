import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Building2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export default function Settings() {
  const { settings, isLoading, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    business_phone: "",
    business_address: "",
    gstin: "",
  });

  // Load data into form when fetched
  useEffect(() => {
    if (settings) {
      setFormData({
        full_name: settings.full_name || "",
        business_name: settings.business_name || "",
        business_phone: settings.business_phone || "",
        business_address: settings.business_address || "",
        gstin: settings.gstin || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <AppLayout title="Settings" subtitle="Manage account and shop details">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Personal Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Shop Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Shop Name</Label><Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>GSTIN</Label><Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Shop Address</Label><Input value={formData.business_address} onChange={(e) => setFormData({ ...formData, business_address: e.target.value })} /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save All Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}