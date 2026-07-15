import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Inbox,
  Wrench,
  Clock,
  IndianRupee,
  PackageX,
  CalendarClock,
} from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { SeverityBadge, ComplaintStatusBadge } from "../../components/ui/StatusBadge";
import { ErrorState } from "../../components/ui/ErrorState";
import { PageHeaderSkeleton, StatGridSkeleton, ListSkeleton } from "../../components/ui/Skeleton";
import type { Complaint } from "../../types";

interface DashboardStats {
  activeContracts: number;
  expiringSoonContracts: number;
  openComplaints: number;
  jobsInProgress: number;
  pendingConfirmations: number;
  outstandingAmount: number;
  lowStockCount: number;
  recentComplaints: Complaint[];
}

// Fixes LOGIC 3 — this used to fire 5 separate requests fetching ALL
// contracts, complaints, jobs, invoices, and inventory just to compute 7
// numbers. Now it's one call to a server-side aggregation endpoint.
export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, reload } = useFetch<DashboardStats>(
    () => api.get("/dashboard/stats").then((r) => r.data),
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <StatGridSkeleton count={4} />
        <Card>
          <CardHeader>
            <CardTitle>Recent complaints</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ListSkeleton items={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stats) {
    return <ErrorState message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <div className="space-y-6">
      {/* Stat grid — single column on mobile, up to 4 across on desktop */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active contracts" value={stats.activeContracts} icon={FileText} />
        <StatCard label="Open complaints" value={stats.openComplaints} icon={Inbox} />
        <StatCard label="Jobs in progress" value={stats.jobsInProgress} icon={Wrench} />
        <StatCard
          label="Pending confirmations"
          value={stats.pendingConfirmations}
          icon={Clock}
          emphasis={stats.pendingConfirmations > 0}
        />
        <StatCard
          label="Outstanding payments"
          value={`₹${stats.outstandingAmount.toLocaleString("en-IN")}`}
          icon={IndianRupee}
        />
        <StatCard
          label="Low stock items"
          value={stats.lowStockCount}
          icon={PackageX}
          emphasis={stats.lowStockCount > 0}
        />
        <StatCard
          label="Contracts expiring soon"
          value={stats.expiringSoonContracts}
          icon={CalendarClock}
          emphasis={stats.expiringSoonContracts > 0}
        />
      </div>

      {/* Recent complaints */}
      <Card>
        <CardHeader>
          <CardTitle>Recent complaints</CardTitle>
          <Link to="/admin/complaints" className="text-xs font-medium text-zinc-500 hover:text-zinc-200">
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {stats.recentComplaints.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500">No complaints yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Ticket</TH>
                  <TH>Description</TH>
                  <TH>Severity</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {stats.recentComplaints.map((c) => (
                  <TR
                    key={c._id}
                    onClick={() => navigate(`/admin/complaints/${c._id}`)}
                    className="cursor-pointer"
                  >
                    <TD className="font-medium text-zinc-100">
                      <Link
                        to={`/admin/complaints/${c._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-accent"
                      >
                        {c.ticketId}
                      </Link>
                    </TD>
                    <TD className="text-zinc-400">{c.description}</TD>
                    <TD truncate={false}>
                      {c.severity ? <SeverityBadge value={c.severity} /> : <span className="text-zinc-600">—</span>}
                    </TD>
                    <TD truncate={false}>
                      <ComplaintStatusBadge value={c.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
