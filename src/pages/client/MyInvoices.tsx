import { useState } from "react";
import { Receipt, IndianRupee, Download } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card } from "../../components/ui/Card";
import { InvoiceStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { StatCard } from "../../components/ui/StatCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { downloadInvoicePdf } from "../../lib/downloadInvoicePdf";
import type { Invoice } from "../../types";

const typeLabel: Record<Invoice["type"], string> = {
  job_chargeable: "Job charge",
  amc_subscription: "AMC subscription",
  overage_visit: "Extra visit",
};

export function MyInvoices() {
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data, isLoading, error, reload } = useFetch<{ invoices: Invoice[]; outstandingTotal: number }>(
    () => api.get("/invoices").then((r) => r.data),
    []
  );
  const invoices = data?.invoices ?? [];
  const outstandingTotal = data?.outstandingTotal ?? 0;

  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice._id);
    try {
      await downloadInvoicePdf(invoice._id, invoice.invoiceId);
    } catch {
      toast.error("Could not download invoice");
    } finally {
      setDownloadingId(null);
    }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="Bills & payments" description="Your invoices and payment history." />

      <div className="mb-4 grid grid-cols-2 gap-4">
        <StatCard label="Outstanding" value={`₹${outstandingTotal.toLocaleString("en-IN")}`} icon={IndianRupee} emphasis={outstandingTotal > 0} />
        <StatCard label="Total invoices" value={invoices.length} icon={Receipt} />
      </div>

      {invoices.length === 0 ? (
        <Card><EmptyState icon={Receipt} message="No invoices yet." /></Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card key={inv._id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{typeLabel[inv.type]}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {inv.invoiceId} · Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-100">₹{inv.totalAmount.toLocaleString("en-IN")}</p>
                    <div className="mt-1"><InvoiceStatusBadge value={inv.status} /></div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleDownload(inv)} isLoading={downloadingId === inv._id}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
