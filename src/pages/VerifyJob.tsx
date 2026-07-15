import { useEffect, useState, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Zap, CheckCircle2, AlertTriangle, ImageIcon, ShieldCheck } from "lucide-react";
import { publicApi } from "../lib/publicApi";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Input";

interface VerificationSummary {
  jobId: string;
  complaint: { ticketId: string; description: string };
  engineer: { name: string };
  materialsUsed: { name: string; quantity: number; unitCost: number }[];
  photosAfter: string[];
}

type Step = "loading" | "summary" | "otp_sent" | "confirmed" | "disputed" | "disputing" | "error";

export function VerifyJob() {
  const { token } = useParams();
  const [step, setStep] = useState<Step>("loading");
  const [summary, setSummary] = useState<VerificationSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    publicApi
      .get(`/jobs/verify/${token}`)
      .then(({ data }) => {
        setSummary(data);
        setStep("summary");
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.error || "This verification link is invalid or has expired.");
        setStep("error");
      });
  }, [token]);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await publicApi.post(`/jobs/verify/${token}/request-otp`, { phone });
      setStep("otp_sent");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Could not send OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmJob(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await publicApi.post(`/jobs/verify/${token}/confirm`, { phone, otp });
      setStep("confirmed");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Incorrect or expired OTP");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDispute(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await publicApi.post(`/jobs/verify/${token}/dispute`, { phone, reason: disputeReason });
      setStep("disputed");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Could not submit dispute");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Zap className="h-5 w-5 text-accent" fill="currentColor" />
          <span className="text-lg font-semibold tracking-tight text-zinc-50">Steadfast</span>
        </div>

        {step === "loading" && <p className="text-center text-sm text-zinc-500">Loading job details…</p>}

        {step === "error" && (
          <Card className="p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-zinc-500" />
            <p className="text-sm text-zinc-300">{errorMsg}</p>
          </Card>
        )}

        {summary && (step === "summary" || step === "otp_sent" || step === "disputing") && (
          <>
            <Card className="mb-4 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Job {summary.jobId}</p>
              <p className="mt-1 text-sm text-zinc-300">{summary.complaint.description}</p>
              <p className="mt-2 text-xs text-zinc-500">Engineer: {summary.engineer.name}</p>

              {summary.materialsUsed.length > 0 && (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Materials used</p>
                  <ul className="space-y-1">
                    {summary.materialsUsed.map((m, i) => (
                      <li key={i} className="flex justify-between text-sm text-zinc-400">
                        <span>{m.name} × {m.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.photosAfter.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                  {summary.photosAfter.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-md border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400">
                      <ImageIcon className="h-3.5 w-3.5" /> Photo {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </Card>

            {step === "summary" && (
              <Card className="p-5">
                <p className="mb-3 text-sm font-medium text-zinc-100">Verify this job</p>
                <form onSubmit={requestOtp} className="space-y-3">
                  <div>
                    <Label>Your registered phone number</Label>
                    <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit number" />
                  </div>
                  {errorMsg && <p className="text-sm text-zinc-400">{errorMsg}</p>}
                  <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                    Send OTP
                  </Button>
                </form>
                <button onClick={() => setStep("disputing")} className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300">
                  Something's wrong with this job? Raise a dispute
                </button>
              </Card>
            )}

            {step === "otp_sent" && (
              <Card className="p-5">
                <p className="mb-3 text-sm font-medium text-zinc-100">Enter the OTP sent to {phone}</p>
                <form onSubmit={confirmJob} className="space-y-3">
                  <Input
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    className="text-center text-lg tracking-[0.5em]"
                  />
                  {errorMsg && <p className="text-sm text-zinc-400">{errorMsg}</p>}
                  <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                    Confirm job
                  </Button>
                </form>
              </Card>
            )}

            {step === "disputing" && (
              <Card className="p-5">
                <p className="mb-3 text-sm font-medium text-zinc-100">What went wrong?</p>
                <form onSubmit={submitDispute} className="space-y-3">
                  <div>
                    <Label>Your registered phone number</Label>
                    <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Reason for dispute</Label>
                    <textarea
                      required
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-accent"
                      placeholder="e.g. Work doesn't match what was described"
                    />
                  </div>
                  {errorMsg && <p className="text-sm text-zinc-400">{errorMsg}</p>}
                  <Button type="submit" variant="outline" className="w-full" isLoading={isSubmitting}>
                    Submit dispute
                  </Button>
                </form>
                <button onClick={() => setStep("summary")} className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300">
                  Back to verification
                </button>
              </Card>
            )}
          </>
        )}

        {step === "confirmed" && (
          <Card className="p-6 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-accent" />
            <p className="text-sm font-medium text-zinc-100">Job confirmed</p>
            <p className="mt-1 text-sm text-zinc-500">Thank you — this job is now marked complete and closed out.</p>
          </Card>
        )}

        {step === "disputed" && (
          <Card className="p-6 text-center">
            <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-100">Dispute submitted</p>
            <p className="mt-1 text-sm text-zinc-500">The business owner has been notified and will review this before any billing proceeds.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
