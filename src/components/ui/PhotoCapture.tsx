import { useRef, useState } from "react";
import { Camera, X, Loader2, AlertCircle } from "lucide-react";
import { uploadPhotoFile } from "../../lib/uploadPhoto";

// Fixes UX 2 — the single most critical gap flagged in the review. No field
// engineer is going to upload a photo to a CDN and paste a link while
// standing at a client's electrical panel. This opens the phone's camera
// directly (capture="environment" = rear camera) and uploads on selection.
// The backend's photoUrls: string[] contract is unchanged — this component
// just produces real, working URLs instead of asking the user to type one.
export function PhotoCapture({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const url = await uploadPhotoFile(file);
      onChange([...urls, url]);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Upload failed — check your connection and try again");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = ""; // allow re-selecting the same file
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {urls.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {urls.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-zinc-800">
              <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-zinc-200 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 py-3 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" /> Take photo
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-zinc-500">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
