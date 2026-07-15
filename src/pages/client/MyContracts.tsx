import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { Card, CardContent } from "../../components/ui/Card";
import { ContractStatusBadge } from "../../components/ui/StatusBadge";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Contract } from "../../types";

export function MyContracts() {
  const { data: contracts, isLoading, error, reload } = useFetch<Contract[]>(
    () => api.get("/contracts").then((r) => r.data.contracts),
    []
  );

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <PageHeader title="My contracts" description="AMC contracts for your site(s)." />

      {(contracts ?? []).length === 0 ? (
        <Card><CardContent><EmptyState icon={FileText} message="No contracts found." /></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(contracts ?? []).map((c) => (
            <Link key={c._id} to={`/client/contracts/${c._id}`}>
              <Card className="p-4 hover:border-zinc-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{c.siteAddress}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {c.visitsUsedThisCycle} / {c.includedVisitsPerCycle} visits used this cycle
                    </p>
                  </div>
                  <ContractStatusBadge value={c.status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
