import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Wrench, QrCode, Copy, Check, Clock, CheckCircle2, AlertTriangle, Navigation } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { JobStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Input, Label } from "../../components/ui/Input";
import { PhotoCapture } from "../../components/ui/PhotoCapture";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Job, Complaint, Contract, InventoryItem } from "../../types";

export function JobExecution() {
  const { id } = useParams();
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null);

  const { data: job, isLoading: isJobLoading, error: jobError, reload: reloadJob } = useFetch<Job>(
    () => api.get(`/jobs/${id}`).then((r) => r.data.job),
    [id]
  );
  const { data: inventory, isLoading: isInventoryLoading } = useFetch<InventoryItem[]>(
    () => api.get("/inventory").then((r) => r.data.items),
    []
  );

  // Fixes BUG 2: qrImageDataUrl only ever lived in local React state, set
  // once at the moment of generation. Refreshing the page or navigating
  // away and back lost it entirely, even though the backend still had
  // job.qrToken. This re-fetches the image from the new GET
  // /jobs/:id/qr-image endpoint whenever a token exists but we don't
  // already have the image in memory.
  useEffect(() => {
    if (job?.qrToken && !qrImageDataUrl) {
      api.get(`/jobs/${job._id}/qr-image`).then(({ data }) => setQrImageDataUrl(data.qrImageDataUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.qrToken]);

  if (isJobLoading || isInventoryLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (jobError) return <ErrorState message={jobError} onRetry={reloadJob} />;
  if (!job) return <div className="text-sm text-zinc-500">Job not found.</div>;

  const complaint = job.complaint as Complaint;
  const contract = job.contract as Contract;
  const verificationLink = job.qrToken ? `${window.location.origin}/verify/${job.qrToken}` : null;
  const mapsUrl = contract?.siteAddress
    ? `https://maps.google.com/?q=${encodeURIComponent(contract.siteAddress)}`
    : null;

  return (
    <div className="max-w-xl">
      <Link to="/engineer" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to my jobs
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{job.jobId}</h2>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-sm text-zinc-500">{contract?.siteAddress}</p>
            {/* Fixes MISSING 8 — no navigation link existed for engineers */}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Navigation className="h-3 w-3" /> Navigate
              </a>
            )}
          </div>
        </div>
        <JobStatusBadge value={job.status} />
      </div>

      <Card className="mb-4">
        <CardContent className="py-4">
          <p className="text-sm text-zinc-300">{complaint?.description}</p>
        </CardContent>
      </Card>

      {job.status === "assigned" && <StartJobCard job={job} onDone={reloadJob} />}

      {job.status === "in_progress" && (
        <>
          <MaterialsCard job={job} inventory={inventory ?? []} onDone={reloadJob} />
          <ReadyForVerificationCard job={job} onGenerated={(url) => setQrImageDataUrl(url)} onDone={reloadJob} />
        </>
      )}

      {(job.status === "in_progress" || job.status === "pending_confirmation") && verificationLink && (
        <VerificationLinkCard
          job={job}
          qrImageDataUrl={qrImageDataUrl}
          verificationLink={verificationLink}
          onMarkedPending={reloadJob}
        />
      )}

      {job.status === "confirmed" && job.verifiedBy && (
        <Card>
          <CardContent className="flex items-start gap-2 py-4">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-100">Confirmed by {job.verifiedBy.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">Great work — this job is closed out.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {job.status === "disputed" && (
        <Card>
          <CardContent className="flex items-start gap-2 py-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-sm font-medium text-zinc-100">Client raised a dispute</p>
              <p className="mt-0.5 text-sm text-zinc-400">{job.disputeReason}</p>
              <p className="mt-1 text-xs text-zinc-600">Admin will review this — no action needed from you right now.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StartJobCard({ job, onDone }: { job: Job; onDone: () => void }) {
  const toast = useToast();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (photoUrls.length === 0) {
      setError("Add at least one before-photo to start the job.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/jobs/${job._id}/start`, { photoUrls });
      toast.success("Job started");
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not start job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Start job</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Before photos</Label>
          <PhotoCapture urls={photoUrls} onChange={setPhotoUrls} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
        <Button variant="primary" className="w-full" onClick={handleStart} isLoading={isSubmitting}>
          <Wrench className="h-4 w-4" /> Start job
        </Button>
      </CardContent>
    </Card>
  );
}

function MaterialsCard({ job, inventory, onDone }: { job: Job; inventory: InventoryItem[]; onDone: () => void }) {
  const toast = useToast();
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function addMaterial() {
    if (!materialId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/jobs/${job._id}/materials`, { materialId, quantity: Number(quantity) });
      toast.success("Material logged");
      setMaterialId("");
      setQuantity("1");
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not log material");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Materials used</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {job.materialsUsed.length > 0 && (
          <ul className="divide-y divide-zinc-900">
            {job.materialsUsed.map((m, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-zinc-300">{m.name}</span>
                <span className="text-zinc-500">× {m.quantity}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Select value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="flex-1">
            <option value="">Select material…</option>
            {inventory.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name} ({item.availableStock} {item.unit} available)
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-20"
          />
          <Button variant="outline" onClick={addMaterial} isLoading={isSubmitting}>Add</Button>
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </CardContent>
    </Card>
  );
}

function ReadyForVerificationCard({
  job,
  onGenerated,
  onDone,
}: {
  job: Job;
  onGenerated: (url: string) => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (job.qrToken) return null; // already generated — VerificationLinkCard takes over

  async function handleSubmit() {
    if (photoUrls.length === 0) {
      setError("Add at least one after-photo before generating the QR code.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/jobs/${job._id}/ready-for-verification`, { photoUrls });
      onGenerated(data.qrImageDataUrl);
      toast.success("Verification QR generated");
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not generate verification QR");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Finish & generate QR</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>After photos</Label>
          <PhotoCapture urls={photoUrls} onChange={setPhotoUrls} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
        <Button variant="primary" className="w-full" onClick={handleSubmit} isLoading={isSubmitting}>
          <QrCode className="h-4 w-4" /> Generate verification QR
        </Button>
      </CardContent>
    </Card>
  );
}

function VerificationLinkCard({
  job,
  qrImageDataUrl,
  verificationLink,
  onMarkedPending,
}: {
  job: Job;
  qrImageDataUrl: string | null;
  verificationLink: string;
  onMarkedPending: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(verificationLink);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  async function markPending() {
    setIsMarking(true);
    try {
      await api.post(`/jobs/${job._id}/mark-pending`);
      toast.success("Marked pending confirmation");
      onMarkedPending();
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Client verification</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {qrImageDataUrl ? (
          <div className="flex justify-center rounded-md bg-zinc-50 p-4">
            <img src={qrImageDataUrl} alt="Verification QR code" className="h-48 w-48" />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Loading QR code…</p>
        )}

        <div className="flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-2">
          <span className="flex-1 truncate text-xs text-zinc-400">{verificationLink}</span>
          <button onClick={copyLink} className="shrink-0 text-zinc-500 hover:text-zinc-100">
            {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Have the client scan the QR code above, or open the link on their own phone. No app or login needed on their end.
        </p>

        {job.status !== "pending_confirmation" ? (
          <Button variant="ghost" className="w-full" onClick={markPending} isLoading={isMarking}>
            <Clock className="h-3.5 w-3.5" /> Client unreachable — mark pending
          </Button>
        ) : (
          <p className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
            Marked pending confirmation. This job will auto-confirm in 48 hours if the client doesn't respond.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
