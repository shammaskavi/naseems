import { format } from "date-fns";
import { MeasurementSet } from "@/hooks/useMeasurements";
import { cn } from "@/lib/utils";

interface JobCardProps {
    job: any; // The job data from StitchingJobs
    measurements: MeasurementSet | null;
    config: any[]; // The labels from measurement_configs
}

export const JobCardTemplate = ({ job, measurements, config }: JobCardProps) => {
    if (!job) return null;

    // Helper to render filtered measurements by category
    const renderCategory = (category: string) => {
        return config
            ?.filter((c) => c.category === category)
            .map((c) => {
                const value = measurements?.[c.name];
                if (!value || value === "-" || value === 0) return null;
                return (
                    <div key={c.name} className="flex justify-between border-b border-dotted border-gray-400 py-0.5">
                        <span className="uppercase font-bold ">{c.label}:</span>
                        <span className="font-bold">{value}</span>
                    </div>
                );
            });
    };

    return (
        <div id="thermal-job-card" className="hidden print:block w-[80mm] p-2 bg-white text-black font-mono">
            {/* Header: High Visibility */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
                <h1 className="text-2xl font-bold">NASEEM'S COUTURE</h1>
                <p className="text-sm font-bold mt-1">JOB CARD</p>
            </div>

            {/* Primary Details */}
            <div className="space-y-1 text-sm border-b border-black pb-2 mb-2">
                <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-bold">{job.orders?.order_number}</span>
                </div>
                <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold uppercase">{job.orders?.customers?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tailor:</span>
                    <span className="font-bold">{job.tailor_name || "NOT ASSIGNED"}</span>
                </div>
                <div className="flex justify-between bg-black text-white px-1">
                    <span>DELIVERY:</span>
                    <span className="font-bold">
                        {job.orders?.delivery_date ? format(new Date(job.orders.delivery_date), "dd-MM-yyyy") : "N/A"}
                    </span>
                </div>
            </div>

            {/* Garment Title */}
            <div className="text-center bg-gray-200 py-1 mb-2">
                <span className="text-lg font-bold uppercase tracking-widest">
                    {job.order_items?.garment_type}
                </span>
            </div>

            {/* Structured Measurements Section */}
            <div className="mb-2">
                <p className="font-bold border-b border-black mb-1">MEASUREMENTS (inches)</p>
                <div className="flex gap-x-4">
                    {/* Left Column: Upper Body */}
                    <div className="flex-1">
                        <p className="font-bold border-b border-black mb-1 uppercase bg-gray-100 text-center">Upper Body</p>
                        {renderCategory("upper_body")}
                    </div>
                    {/* Right Column: Lower Body */}
                    <div className="flex-1">
                        <p className="font-bold border-b border-black mb-1 uppercase bg-gray-100 text-center">Lower Body</p>
                        {renderCategory("lower_body")}
                    </div>
                </div>
            </div>

            {/* Fit & Posture */}
            <div className="border-t border-black pt-1 mb-2">
                <div className="flex justify-between text-sm">
                    <span>FIT: <span className="font-bold uppercase">{measurements?.fit_type}</span></span>
                    <span>POSTURE: <span className="font-bold">{measurements?.body_posture || "-"}</span></span>
                </div>
            </div>

            {/* Design Notes: The Most Important Part */}
            <div className="border-2 border-black p-1">
                <p className="text-[10px] font-bold uppercase underline mb-1">Stitching Instructions:</p>
                <p className="text-sm font-bold leading-tight whitespace-pre-wrap">
                    {measurements?.design_notes || "No specific instructions."}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-[12px]">
                <p>Printed on {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                <p className="mt-1">------------------------------</p>
            </div>
        </div>
    );
};