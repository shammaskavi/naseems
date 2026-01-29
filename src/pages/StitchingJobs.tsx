import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Printer, Loader2, CheckCircle, User, Ruler, Play, Pause, Plus } from "lucide-react";
import { useStitchingJobs, useUpdateStitchingJob, useMarkJobPrinted } from "@/hooks/useStitchingJobs";
import { useMeasurementSet } from "@/hooks/useMeasurements";
import { useWorkers, useCreateWorker } from "@/hooks/useWorkers";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  assigned: { label: "Assigned", className: "bg-info/15 text-info" },
  in_progress: { label: "In Progress", className: "bg-warning/15 text-warning" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
  on_hold: { label: "On Hold", className: "bg-destructive/15 text-destructive" },
};

function MeasurementBadge({ orderItemId }: { orderItemId: string }) {
  const { data: measurement, isLoading } = useMeasurementSet(orderItemId);
  if (isLoading) return <Badge variant="outline">...</Badge>;
  return measurement ? (
    <Badge variant="default" className="bg-success/15 text-success">Measured</Badge>
  ) : (
    <Badge variant="destructive">No Measurements</Badge>
  );
}

export default function StitchingJobs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; jobId: string | null }>({ open: false, jobId: null });
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [newWorkerName, setNewWorkerName] = useState("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  
  const { data: jobs = [], isLoading } = useStitchingJobs();
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const updateJob = useUpdateStitchingJob();
  const markPrinted = useMarkJobPrinted();
  const createWorker = useCreateWorker();

  const filteredJobs = jobs.filter((job) =>
    job.orders?.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.orders?.customers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.order_items?.garment_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (job.tailor_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!assignDialog.jobId) return;
    
    let tailorName = "";
    if (showAddWorker && newWorkerName.trim()) {
      // Create new worker first
      const result = await createWorker.mutateAsync({ name: newWorkerName.trim(), is_active: true, phone: null, specialization: null });
      tailorName = result.name;
    } else if (selectedWorkerId) {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      tailorName = worker?.name || "";
    }
    
    if (!tailorName) return;
    
    await updateJob.mutateAsync({ id: assignDialog.jobId, tailor_name: tailorName, status: "assigned" });
    setAssignDialog({ open: false, jobId: null });
    setSelectedWorkerId("");
    setNewWorkerName("");
    setShowAddWorker(false);
  };

  const handleStatusChange = async (jobId: string, status: string) => {
    const updates: any = { id: jobId, status };
    if (status === "in_progress") updates.started_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await updateJob.mutateAsync(updates);
  };

  if (isLoading) {
    return (
      <AppLayout title="Stitching Jobs" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Stitching Jobs" subtitle="Track and manage stitching work">
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs by order, customer, garment, or tailor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-5">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{config.label}</p>
              <p className="text-2xl font-bold">{jobs.filter((j) => j.status === status).length}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Measurements</TableHead>
                <TableHead>Tailor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Printed</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No jobs found</TableCell></TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/orders/${job.order_id}`)}>
                        {job.orders?.order_number}
                      </Button>
                    </TableCell>
                    <TableCell>{job.orders?.customers?.name}</TableCell>
                    <TableCell>{job.order_items?.garment_type} x{job.order_items?.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MeasurementBadge orderItemId={job.order_item_id} />
                        <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/measurements/${job.order_item_id}`)}>
                          <Ruler className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.tailor_name ? (
                        <span className="font-medium">{job.tailor_name}</span>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setAssignDialog({ open: true, jobId: job.id })}>
                          <User className="h-4 w-4 mr-1" />Assign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-full text-xs", statusConfig[job.status as keyof typeof statusConfig]?.className)}>
                        {statusConfig[job.status as keyof typeof statusConfig]?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {job.printed_at ? (
                        <span className="text-xs text-muted-foreground">{format(new Date(job.printed_at), "dd/MM HH:mm")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/measurements/${job.order_item_id}`)}>
                            <Ruler className="h-4 w-4 mr-2" />View Measurements
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markPrinted.mutate(job.id)}>
                            <Printer className="h-4 w-4 mr-2" />Print Job Card
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setAssignDialog({ open: true, jobId: job.id })}>
                            <User className="h-4 w-4 mr-2" />Assign Tailor
                          </DropdownMenuItem>
                          {job.status !== "in_progress" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, "in_progress")}>
                              <Play className="h-4 w-4 mr-2" />Start Work
                            </DropdownMenuItem>
                          )}
                          {job.status === "in_progress" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, "on_hold")}>
                              <Pause className="h-4 w-4 mr-2" />Put On Hold
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleStatusChange(job.id, "completed")}>
                            <CheckCircle className="h-4 w-4 mr-2" />Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Assign Tailor Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => { setAssignDialog({ ...assignDialog, open }); setShowAddWorker(false); setNewWorkerName(""); setSelectedWorkerId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tailor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!showAddWorker ? (
              <>
                <div className="space-y-2">
                  <Label>Select Tailor</Label>
                  <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={workersLoading ? "Loading..." : "Select a tailor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}{worker.specialization ? ` (${worker.specialization})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowAddWorker(true)}>
                  <Plus className="h-4 w-4 mr-1" />Add New Tailor
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label>New Tailor Name</Label>
                <Input placeholder="Enter tailor name" value={newWorkerName} onChange={(e) => setNewWorkerName(e.target.value)} />
                <Button variant="link" size="sm" onClick={() => setShowAddWorker(false)}>
                  ← Select existing tailor
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, jobId: null })}>Cancel</Button>
            <Button onClick={handleAssign} disabled={updateJob.isPending || createWorker.isPending || (!selectedWorkerId && !newWorkerName.trim())}>
              {(updateJob.isPending || createWorker.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
