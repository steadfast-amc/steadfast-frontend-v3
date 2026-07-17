import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { ComplaintStatusBadge, SeverityBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/ErrorState";
import { PhotoGallery } from "../../components/ui/PhotoGallery";
import type { Complaint } from "../../types";

export function ComplaintView() {
  const { id } = useParams();
  const toast = useToast();
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const { data: complaint, isLoading, error, reload } = useFetch<Complaint>(
    () => api.get(`/complaints/${id}`).then((r) => r.data.complaint),
    [id]
  );

  async function approveQuote() {
    setIsApproving(true);
    try {
      await api.post(`/complaints/${id}/approve-quote`);
      toast.success("Quote approved");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not approve quote");
    } finally {
      setIsApproving(false);
    }
  }

  async function requestRevision() {
    setIsRequestingRevision(true);
    try {
      await api.post(`/complaints/${id}/request-quote-revision`, { note: revisionNote || undefined });
      toast.success("Sent back to admin for revision");
      setShowRevisionForm(false);
      setRevisionNote("");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not send revision request");
    } finally {
      setIsRequestingRevision(false);
    }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!complaint) return <div className="text-sm text-zinc-500">Complaint not found.</div>;

  const quoteLineItems = Array.isArray(complaint.quote?.lineItems) ? complaint.quote.lineItems : [];
  const quoteTotalAmount = Number(complaint.quote?.totalAmount ?? 0);
  const formatAmount = (value: number | undefined) => Number(value ?? 0).toLocaleString("en-IN");

  return (
    <div className="max-w-2xl">
      <Link to="/client/complaints" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{complaint.ticketId}</h2>
          <p className="text-sm text-zinc-500">{new Date(complaint.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-2">
          {complaint.severity && <SeverityBadge value={complaint.severity} />}
          <ComplaintStatusBadge value={complaint.status} />
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">{complaint.description}</p>
          {complaint.photoUrls.length > 0 && (
            <div className="mt-3">
              <PhotoGallery urls={complaint.photoUrls} label="Complaint photo" />
            </div>
          )}
        </CardContent>
      </Card>

      {complaint.quote && (
        <Card>
          <CardHeader>
            <CardTitle>Quote</CardTitle>
            {complaint.quote.approvedAt && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            )}
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-zinc-900">
              {quoteLineItems.map((li, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-300">{li.description} × {li.quantity}</span>
                  <span className="font-medium text-zinc-100">₹{formatAmount(li.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-3 text-sm font-semibold">
              <span className="text-zinc-100">Total</span>
              <span className="text-zinc-100">₹{formatAmount(quoteTotalAmount)}</span>
            </div>

            {!complaint.quote.approvedAt && (
              <div className="mt-4 space-y-2">
                <Button variant="primary" className="w-full" onClick={approveQuote} isLoading={isApproving}>
                  Approve quote
                </Button>
                {!showRevisionForm ? (
                  <button
                    type="button"
                    onClick={() => setShowRevisionForm(true)}
                    className="w-full text-center text-xs text-zinc-500 hover:text-zinc-200"
                  >
                    Not satisfied? Request a revision instead
                  </button>
                ) : (
                  <div className="rounded-md border border-zinc-800 p-3">
                    <Label htmlFor="revision-note">What would you like changed? (optional)</Label>
                    <textarea
                      id="revision-note"
                      value={revisionNote}
                      onChange={(e) => setRevisionNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-accent"
                      placeholder="e.g. the labour charge seems high for this job"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowRevisionForm(false)}>Cancel</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestRevision}
                        isLoading={isRequestingRevision}
                      >
                        Send revision request
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
