import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { SeverityBadge, ComplaintStatusBadge, BillingTypeBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Label } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { ErrorState } from "../../components/ui/ErrorState";
import { PhotoGallery } from "../../components/ui/PhotoGallery";
import { QuoteEditor } from "../../components/ui/QuoteEditor";
import { COMPLAINT_CATEGORIES, SEVERITY_LEVELS, BILLING_TYPES } from "../../types";
import type { Complaint, User, Contract, ComplaintCategory, Severity, BillingType } from "../../types";

export function ComplaintDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: complaint, isLoading, error, reload } = useFetch<Complaint>(
    () => api.get(`/complaints/${id}`).then((r) => r.data.complaint),
    [id]
  );
  const [triage, setTriage] = useState<{ category: string; severity: string; billingType: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [isQuoteEditorOpen, setIsQuoteEditorOpen] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Sync local triage form state once the complaint has loaded (and again
  // whenever it's reloaded after a save).
  const activeTriage = triage ?? {
    category: complaint?.category ?? "",
    severity: complaint?.severity ?? "",
    billingType: complaint?.billingType ?? "",
  };

  function applyAiSuggestion() {
    if (!complaint?.aiSuggestion) return;
    setTriage({
      category: complaint.aiSuggestion.category,
      severity: complaint.aiSuggestion.severity,
      billingType: complaint.aiSuggestion.billingType,
    });
  }

  async function saveTriage() {
    setIsSaving(true);
    try {
      const nextStatus = complaint?.status === "new" ? "triaged" : undefined;
      await api.patch(`/complaints/${id}/triage`, {
        ...(activeTriage.category && { category: activeTriage.category }),
        ...(activeTriage.severity && { severity: activeTriage.severity }),
        ...(activeTriage.billingType && { billingType: activeTriage.billingType }),
        ...(nextStatus && { status: nextStatus }),
      });
      toast.success("Triage saved");
      setTriage(null);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not save triage");
    } finally {
      setIsSaving(false);
    }
  }

  async function generateQuote() {
    setIsGeneratingQuote(true);
    try {
      await api.post(`/complaints/${id}/generate-quote`);
      toast.success("Quote generated");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not generate quote");
    } finally {
      setIsGeneratingQuote(false);
    }
  }

  async function saveQuote(lineItems: { description: string; quantity: number; unitCost: number }[]) {
    setIsSavingQuote(true);
    try {
      const wasApproved = !!complaint?.quote?.approvedAt;
      const endpoint = wasApproved ? `/complaints/${id}/quote/revise` : `/complaints/${id}/quote`;
      await api.patch(endpoint, { lineItems });
      toast.success(wasApproved ? "Revised quote sent to client" : "Quote sent to client");
      setIsQuoteEditorOpen(false);
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not save quote");
    } finally {
      setIsSavingQuote(false);
    }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!complaint) return <div className="text-sm text-zinc-500">Complaint not found.</div>;

  const client = complaint.client as User;
  const contract = complaint.contract as Contract;
  const quoteLineItems = Array.isArray(complaint.quote?.lineItems) ? complaint.quote.lineItems : [];
  const quoteTotalAmount =
    typeof complaint.quote?.totalAmount === "number" && Number.isFinite(complaint.quote.totalAmount)
      ? complaint.quote.totalAmount
      : quoteLineItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const canGenerateQuote =
    complaint.billingType === "chargeable" && !!complaint.category && !complaint.quote;
  const canBuildQuoteManually =
    complaint.billingType === "chargeable" && !!complaint.category;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/complaints" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to complaints
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{complaint.ticketId}</h2>
          <p className="text-sm text-zinc-500">
            {client?.name} · {contract?.siteAddress}
          </p>
        </div>
        <ComplaintStatusBadge value={complaint.status} />
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">{complaint.description}</p>
          {complaint.locationNote && (
            <p className="mt-2 text-xs text-zinc-500">Location: {complaint.locationNote}</p>
          )}
          {complaint.photoUrls.length > 0 && (
            <div className="mt-3">
              <PhotoGallery urls={complaint.photoUrls} label="Complaint photo" />
            </div>
          )}
        </CardContent>
      </Card>

      {complaint.aiSuggestion ? (
        <Card className="mb-4 border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> AI suggestion
            </CardTitle>
            <Badge
              label={`${Math.round(complaint.aiSuggestion.confidence * 100)}% confidence`}
              variant="accent"
            />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500">Category:</span>
              <span className="font-medium text-zinc-100">{complaint.aiSuggestion.category.replace(/_/g, " ")}</span>
              <span className="mx-1 text-zinc-700">·</span>
              <SeverityBadge value={complaint.aiSuggestion.severity} />
              <span className="mx-1 text-zinc-700">·</span>
              <BillingTypeBadge value={complaint.aiSuggestion.billingType} />
            </div>
            <p className="mt-2 text-xs text-zinc-600">Model version {complaint.aiSuggestion.modelVersion} — a suggestion only. Review before saving.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={applyAiSuggestion}>
              Apply suggestion to triage form
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Fixes MISSING 9 — previously there was no explanation for why a
        // complaint had no AI suggestion, which reads as broken rather than
        // "the classifier service is down" or "still processing".
        <Card className="mb-4">
          <CardContent className="flex items-start gap-2 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <div>
              <p className="text-sm text-zinc-300">No AI suggestion available for this complaint.</p>
              <p className="mt-0.5 text-xs text-zinc-600">
                Either the classifier service was unreachable when this complaint was created, or it hasn't
                been configured yet. Triage manually below — this never blocks the workflow.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader><CardTitle>Triage</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>Category</Label>
              <Select value={activeTriage.category} onChange={(e) => setTriage({ ...activeTriage, category: e.target.value })}>
                <option value="">—</option>
                {COMPLAINT_CATEGORIES.map((c: ComplaintCategory) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={activeTriage.severity} onChange={(e) => setTriage({ ...activeTriage, severity: e.target.value })}>
                <option value="">—</option>
                {SEVERITY_LEVELS.map((s: Severity) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Billing type</Label>
              <Select value={activeTriage.billingType} onChange={(e) => setTriage({ ...activeTriage, billingType: e.target.value })}>
                <option value="">—</option>
                {BILLING_TYPES.map((b: BillingType) => (
                  <option key={b} value={b}>{b.replace(/_/g, " ")}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={saveTriage} isLoading={isSaving}>
              Save triage
            </Button>
            {canGenerateQuote && (
              <Button variant="outline" onClick={generateQuote} isLoading={isGeneratingQuote}>
                <FileText className="h-3.5 w-3.5" /> Generate quote (estimator)
              </Button>
            )}
            {canBuildQuoteManually && !isQuoteEditorOpen && !complaint.quote && (
              <Button variant="ghost" onClick={() => setIsQuoteEditorOpen(true)}>
                Or build quote manually
              </Button>
            )}
          </div>

          {/* AMC-covered and undetermined complaints never need a quote — the
              monthly fee covers AMC work, and "undetermined" means Admin
              hasn't yet decided whether this is chargeable at all. Job
              creation for these skips straight from "triaged" to job
              creation (see job.controller.ts::createJob's readyStatuses) —
              this note makes that bypass visible instead of leaving the
              client wondering where their quote is. */}
          {complaint.billingType !== "chargeable" && complaint.category && (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500">
              {complaint.billingType === "amc_covered"
                ? "AMC covered — no quote needed. This job can go straight to assignment once triaged."
                : "Billing type is still undetermined — set it to \"chargeable\" above if this work should be quoted, or \"amc_covered\" if it's covered by the contract."}
            </div>
          )}
        </CardContent>
      </Card>

      {isQuoteEditorOpen && (
        <Card className="mb-4">
          <CardHeader><CardTitle>Build quote</CardTitle></CardHeader>
          <CardContent>
            <QuoteEditor
              initialLineItems={complaint.quote?.lineItems ?? []}
              onSave={saveQuote}
              isSaving={isSavingQuote}
              saveLabel="Send quote to client"
            />
          </CardContent>
        </Card>
      )}

      {complaint.quote && !isQuoteEditorOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Quote</CardTitle>
            <span className="text-xs text-zinc-500">
              {complaint.quote.approvedAt ? "Approved by client" : "Awaiting client approval"}
            </span>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-zinc-900">
              {quoteLineItems.map((li, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-300">{li.description || "Line item"} × {li.quantity || 0}</span>
                  <span className="font-medium text-zinc-100">₹{(Number(li.lineTotal) || 0).toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-800 pt-3 text-sm font-semibold">
              <span className="text-zinc-100">Total</span>
              <span className="text-zinc-100">₹{quoteTotalAmount.toLocaleString("en-IN")}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsQuoteEditorOpen(true)}>
              {complaint.quote.approvedAt ? "Revise quote" : "Edit quote"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
