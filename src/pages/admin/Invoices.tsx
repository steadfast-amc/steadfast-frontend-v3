import { useState } from "react";
import { Receipt, IndianRupee, Download } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { InvoiceStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { StatCard } from "../../components/ui/StatCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { downloadInvoicePdf } from "../../lib/downloadInvoicePdf";
import type { Invoice, User } from "../../types";

const typeLabel: Record<Invoice["type"], string> = {
  job_chargeable: "Job (chargeable)",
  amc_subscription: "AMC subscription",
  overage_visit: "Overage visit",
};

export function Invoices() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, error, reload } = useFetch<{ invoices: Invoice[]; outstandingTotal: number }>(
    () => api.get(`/invoices${statusFilter ? `?status=${statusFilter}` : ""}`).then((r) => r.data),
    [statusFilter]
  );
  const invoices = data?.invoices ?? [];
  const outstandingTotal = data?.outstandingTotal ?? 0;

  async function markPaid(id: string) {
    setMarkingId(id);
    try {
      await api.patch(`/invoices/${id}/mark-paid`, { paymentMethod: "manual" });
      toast.success("Marked paid");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not update invoice");
    } finally {
      setMarkingId(null);
    }
  }

  // Fixes MISSING 6 — no way to download an invoice existed anywhere,
  // despite PDFKit being in the tech stack since the original synopsis.
  async function handleDownload(invoice: Invoice) {
    setDownloadingId(invoice._id);
    try {
      await downloadInvoicePdf(invoice._id, invoice.invoiceId);
    } catch {
      toast.error("Could not download invoice PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Billing across jobs and AMC subscriptions."
        action={
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={`₹${outstandingTotal.toLocaleString("en-IN")}`} icon={IndianRupee} emphasis={outstandingTotal > 0} />
        <StatCard label="Total invoices" value={invoices.length} icon={Receipt} />
      </div>

      <Card>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} message="No invoices match this filter." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Invoice</TH>
                  <TH>Client</TH>
                  <TH>Type</TH>
                  <TH>Amount</TH>
                  <TH>Due</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((inv) => {
                  const client = inv.client as User;
                  return (
                    <TR key={inv._id}>
                      <TD className="font-medium text-zinc-100">{inv.invoiceId}</TD>
                      <TD className="text-zinc-400">{client?.name ?? "—"}</TD>
                      <TD className="text-zinc-400">{typeLabel[inv.type]}</TD>
                      <TD>₹{inv.totalAmount.toLocaleString("en-IN")}</TD>
                      <TD className="text-zinc-500">{new Date(inv.dueDate).toLocaleDateString("en-IN")}</TD>
                      <TD truncate={false}><InvoiceStatusBadge value={inv.status} /></TD>
                      <TD truncate={false}>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(inv)} isLoading={downloadingId === inv._id}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {inv.status !== "paid" && (
                            <Button size="sm" variant="ghost" onClick={() => markPaid(inv._id)} isLoading={markingId === inv._id}>
                              Mark paid
                            </Button>
                          )}
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
