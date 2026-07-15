import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Inbox } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { Card } from "../../components/ui/Card";
import { ComplaintStatusBadge, SeverityBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { RaiseComplaintModal } from "./RaiseComplaintModal";
import type { Complaint, Contract } from "../../types";

export function MyComplaints() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: complaints, isLoading, error, reload } = useFetch<Complaint[]>(
    () => api.get("/complaints").then((r) => r.data.complaints),
    []
  );
  const { data: contracts } = useFetch<Contract[]>(
    () => api.get("/contracts").then((r) => r.data.contracts),
    []
  );

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader
        title="My complaints"
        description="Raise issues and track their status."
        action={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} disabled={(contracts ?? []).length === 0}>
            <Plus className="h-4 w-4" /> Raise complaint
          </Button>
        }
      />

      {(complaints ?? []).length === 0 ? (
        <Card><EmptyState icon={Inbox} message="No complaints raised yet." /></Card>
      ) : (
        <div className="space-y-2">
          {(complaints ?? []).map((c) => (
            <Link key={c._id} to={`/client/complaints/${c._id}`}>
              <Card className="p-4 hover:border-zinc-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{c.description}</p>
                    <p className="mt-1 text-xs text-zinc-600">{c.ticketId} · {new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {c.severity && <SeverityBadge value={c.severity} />}
                    <ComplaintStatusBadge value={c.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <RaiseComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contracts={contracts ?? []}
        onCreated={reload}
      />
    </div>
  );
}
