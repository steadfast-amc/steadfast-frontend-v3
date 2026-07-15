import { useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, UserPlus, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { useFetch } from "../../lib/useFetch";
import { useToast } from "../../lib/toast";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { ContractStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, Label } from "../../components/ui/Input";
import { ErrorState } from "../../components/ui/ErrorState";
import type { Contract, User } from "../../types";

export function ContractDetail() {
  const { id } = useParams();
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const { data: contract, isLoading, error, reload } = useFetch<Contract>(
    () => api.get(`/contracts/${id}`).then((r) => r.data.contract),
    [id]
  );

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!contract) return <div className="text-sm text-zinc-500">Contract not found.</div>;

  const client = contract.client as User;
  const hasPendingRenewal = contract.renewalProposal && !contract.renewalProposal.confirmedAt;

  return (
    <div className="max-w-3xl">
      <Link to="/admin/contracts" className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to contracts
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{client?.name}</h2>
          <p className="text-sm text-zinc-500">{contract.siteAddress}</p>
        </div>
        <ContractStatusBadge value={contract.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contract terms</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Fee" value={`₹${contract.feeAmount.toLocaleString("en-IN")} / ${contract.billingCycle}`} />
            <Row label="Included visits" value={`${contract.visitsUsedThisCycle} used of ${contract.includedVisitsPerCycle}`} />
            <Row label="Extra visit charge" value={`₹${contract.additionalVisitCharge.toLocaleString("en-IN")}`} />
            <Row label="Start" value={new Date(contract.startDate).toLocaleDateString("en-IN")} />
            <Row label="Expires" value={new Date(contract.endDate).toLocaleDateString("en-IN")} />
            <Row label="Covered scope" value={contract.coveredScope || "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Primary contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Name" value={client?.name ?? "—"} />
            <Row label="Phone" value={client?.phone ?? "—"} />
            <Row label="Email" value={client?.email ?? "—"} />
          </CardContent>
        </Card>
      </div>

      {/* Fixes MISSING 5 — no renewal action existed anywhere in the UI,
          only a notification. Admin proposes; client confirms elsewhere. */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Renewal</CardTitle>
          {!hasPendingRenewal && (
            <Button size="sm" variant="outline" onClick={() => setIsRenewalModalOpen(true)}>
              <RefreshCw className="h-3.5 w-3.5" /> Propose renewal
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {hasPendingRenewal ? (
            <div className="text-sm">
              <p className="text-zinc-300">
                Proposed: new end date{" "}
                <span className="font-medium text-zinc-100">
                  {new Date(contract.renewalProposal!.proposedEndDate).toLocaleDateString("en-IN")}
                </span>
                , fee{" "}
                <span className="font-medium text-zinc-100">
                  ₹{contract.renewalProposal!.proposedFeeAmount.toLocaleString("en-IN")}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">Awaiting client confirmation through their portal.</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              No pending renewal proposal. Propose one as this contract nears expiry.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Authorized personnel</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsPersonnelModalOpen(true)} disabled={contract.authorizedPersonnel.length >= 3}>
            <UserPlus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {contract.authorizedPersonnel.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No authorized personnel added. Up to 3 people besides the primary client can verify jobs on this contract.
            </p>
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

      <AddPersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        contractId={contract._id}
        onAdded={reload}
      />
      <ProposeRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        contract={contract}
        onProposed={reload}
      />
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
          <Button variant="primary" form="add-personnel-form" type="submit" isLoading={isSubmitting}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </>
      }
    >
      <form id="add-personnel-form" onSubmit={handleSubmit} className="space-y-4">
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

function ProposeRenewalModal({
  isOpen,
  onClose,
  contract,
  onProposed,
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onProposed: () => void;
}) {
  const toast = useToast();
  const [proposedEndDate, setProposedEndDate] = useState("");
  const [proposedFeeAmount, setProposedFeeAmount] = useState(String(contract.feeAmount));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post(`/contracts/${contract._id}/propose-renewal`, {
        proposedEndDate,
        proposedFeeAmount: Number(proposedFeeAmount),
      });
      toast.success("Renewal proposed — client will see it in their portal");
      onProposed();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not propose renewal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Propose renewal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="propose-renewal-form" type="submit" isLoading={isSubmitting}>
            Send proposal
          </Button>
        </>
      }
    >
      <form id="propose-renewal-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>New end date</Label>
          <Input required type="date" value={proposedEndDate} onChange={(e) => setProposedEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Renewed fee amount (₹)</Label>
          <Input required type="number" min={0} value={proposedFeeAmount} onChange={(e) => setProposedFeeAmount(e.target.value)} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
