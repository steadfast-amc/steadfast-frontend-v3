import { useState, useEffect, FormEvent } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../lib/toast";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input, Label } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { PhotoCapture } from "../../components/ui/PhotoCapture";
import type { Contract } from "../../types";

export function RaiseComplaintModal({
  isOpen,
  onClose,
  contracts,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  contracts: Contract[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [contractId, setContractId] = useState("");
  const [description, setDescription] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && contracts.length === 1) {
      setContractId(contracts[0]._id);
    }
  }, [isOpen, contracts]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/complaints", { contractId, description, locationNote, photoUrls });
      toast.success("Complaint submitted");
      onCreated();
      onClose();
      setContractId("");
      setDescription("");
      setLocationNote("");
      setPhotoUrls([]);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise a complaint"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" form="raise-complaint-form" type="submit" isLoading={isSubmitting}>Submit</Button>
        </>
      }
    >
      <form id="raise-complaint-form" onSubmit={handleSubmit} className="space-y-4">
        {contracts.length === 0 && (
          <p className="text-sm text-zinc-500">
            You don't have an active contract yet — contact your account manager before raising a complaint.
          </p>
        )}
        {contracts.length > 1 && (
          <div>
            <Label>Site</Label>
            <Select required value={contractId} onChange={(e) => setContractId(e.target.value)}>
              <option value="">Select a site…</option>
              {contracts.map((c) => (
                <option key={c._id} value={c._id}>{c.siteAddress}</option>
              ))}
            </Select>
          </div>
        )}
        <div>
          <Label>What's the issue?</Label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Sparking wires near the server room"
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-accent"
          />
        </div>
        <div>
          <Label>Location (optional)</Label>
          <Input value={locationNote} onChange={(e) => setLocationNote(e.target.value)} placeholder="e.g. 2nd floor, server room" />
        </div>
        <div>
          <Label>Photos (optional)</Label>
          <PhotoCapture urls={photoUrls} onChange={setPhotoUrls} />
        </div>
        {error && <p className="text-sm text-zinc-400">{error}</p>}
      </form>
    </Modal>
  );
}
