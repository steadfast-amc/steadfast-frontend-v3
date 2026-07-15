import { useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, FileText, IndianRupee, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { ComplaintStatusBadge } from "../../components/ui/StatusBadge";
import { ErrorState } from "../../components/ui/ErrorState";
import { StatGridSkeleton, ListSkeleton } from "../../components/ui/Skeleton";
import { RaiseComplaintModal } from "./RaiseComplaintModal";
import type { Complaint, Contract, Invoice } from "../../types";

export function ClientDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error, reload } = useFetch<{
    contracts: Contract[];
    complaints: Complaint[];
    outstandingTotal: number;
  }>(
    () =>
      Promise.all([api.get("/contracts"), api.get("/complaints"), api.get("/invoices")]).then(
        ([contractsRes, complaintsRes, invoicesRes]) => ({
          contracts: contractsRes.data.contracts,
          complaints: complaintsRes.data.complaints,
          outstandingTotal: invoicesRes.data.outstandingTotal ?? 0,
        })
      ),
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatGridSkeleton count={3} />
        <Card>
          <CardHeader>
            <CardTitle>Recent complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <ListSkeleton items={4} />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error || !data) return <ErrorState message={error ?? undefined} onRetry={reload} />;

  const { contracts, complaints, outstandingTotal } = data;
  const openComplaints = complaints.filter((c) => !["closed", "rejected"].includes(c.status));
  const activeContract = contracts.find((c) => c.status === "active");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Active contracts" value={contracts.filter((c) => c.status === "active").length} icon={FileText} />
        <StatCard label="Open complaints" value={openComplaints.length} icon={Inbox} />
        <StatCard
          label="Outstanding"
          value={`₹${outstandingTotal.toLocaleString("en-IN")}`}
          icon={IndianRupee}
          emphasis={outstandingTotal > 0}
        />
      </div>

      {activeContract && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-zinc-500">Visits used this cycle</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {activeContract.visitsUsedThisCycle} / {activeContract.includedVisitsPerCycle}
              </p>
            </div>
            {/* Fixes UX 3 — this used to navigate to /client/complaints,
                forcing a second click to actually open the form. Opens the
                modal directly now, same as it does from the Complaints page. */}
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" /> Raise a complaint
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent complaints</CardTitle>
          <Link to="/client/complaints" className="text-xs font-medium text-zinc-500 hover:text-zinc-200">View all</Link>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p className="text-sm text-zinc-500">No complaints raised yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {complaints.slice(0, 5).map((c) => (
                <li key={c._id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-zinc-300">{c.description}</p>
                    <p className="text-xs text-zinc-600">{c.ticketId}</p>
                  </div>
                  <ComplaintStatusBadge value={c.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <RaiseComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contracts={contracts}
        onCreated={reload}
      />
    </div>
  );
}
