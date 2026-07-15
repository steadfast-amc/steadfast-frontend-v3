import { useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { ContractStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, Label } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Contract } from "../../types";

export function ContractView() {
  const { id } = useParams();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { data: contract, isLoading, error, reload } = useFetch<Contract>(
    () => api.get(`/contracts/${id}`).then((r) => r.data.contract),
    [id]
  );

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!contract) return <div className="text-sm text-zinc-500">Contract not found.</div>;

  const hasPendingRenewal = contract.renewalProposal && !contract.renewalProposal.confirmedAt;

  async function confirmRenewal() {
    setIsConfirming(true);
    try {
      await api.post(`/contracts/${id}/confirm-renewal`);
      toast.success("Renewal confirmed");
      reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not confirm renewal");
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/client/contracts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">{contract.siteAddress}</h2>
        <ContractStatusBadge value={contract.status} />
      </div>

      {/* Fixes MISSING 5 — client side of the renewal flow */}
      {hasPendingRenewal && (
        <Card className="mb-4 border-accent/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-zinc-100">Renewal available</p>
            <p className="mt-1 text-sm text-zinc-400">
              New expiry:{" "}
              {new Date(contract.renewalProposal!.proposedEndDate).toLocaleDateString("en-IN")} · Fee: ₹
              {contract.renewalProposal!.proposedFeeAmount.toLocaleString("en-IN")}
            </p>
            <Button variant="primary" className="mt-3" onClick={confirmRenewal} isLoading={isConfirming}>
              <CheckCircle2 className="h-4 w-4" /> Confirm renewal
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader><CardTitle>Contract terms</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Fee" value={`₹${contract.feeAmount.toLocaleString("en-IN")} / ${contract.billingCycle}`} />
          <Row label="Visits this cycle" value={`${contract.visitsUsedThisCycle} used of ${contract.includedVisitsPerCycle}`} />
          <Row label="Extra visit charge" value={`₹${contract.additionalVisitCharge.toLocaleString("en-IN")}`} />
          <Row label="Covered scope" value={contract.coveredScope || "Standard AMC scope"} />
          <Row label="Expires" value={new Date(contract.endDate).toLocaleDateString("en-IN")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorized personnel</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)} disabled={contract.authorizedPersonnel.length >= 3}>
            <UserPlus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-xs text-zinc-500">
            Up to 3 people who can verify completed jobs on your behalf when you're not available on-site.
          </p>
          {contract.authorizedPersonnel.length === 0 ? (
            <p className="text-sm text-zinc-500">None added yet.</p>
          ) : (
            <ul className="space-y-2">
              {contract.authorizedPersonnel.map((p) => (
                <li key={p._id} className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-zinc-100">{p.name}</span>
                    <span className="ml-2 text-zinc-500">{p.designation}</span>
                  </div>
                  <span className="text-zinc-400">{p.phone}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AddPersonnelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contractId={contract._id} onAdded={reload} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-100">{value}</span>
    </div>
  );
}

function AddPersonnelModal({
  isOpen,
  onClose,
  contractId,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  onAdded: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", designation: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post(`/contracts/${contractId}/authorized-personnel`, form);
      toast.success("Authorized personnel added");
      onAdded();
      onClose();
      setForm({ name: "", phone: "", designation: "" });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not add personnel");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add authorized personnel"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="client-add-personnel-form" type="submit" isLoading={isSubmitting}>Add</Button>
        </>
      }
    >
      <form id="client-add-personnel-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label>Designation</Label>
          <Input required placeholder="e.g. Facilities Manager" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
