import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";
import { cn } from "../../lib/utils";

// Replaces the old pattern of <a target="_blank"> per photo (which kicked
// the user out of the page into a bare browser image tab). Thumbnails open
// a lightweight in-page lightbox instead — no new dependency, just a fixed
// overlay + keyboard nav, consistent with Modal.tsx's own pattern.
export function PhotoGallery({ urls, label = "Photo" }: { urls: string[]; label?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-800"
          >
            <img src={url} alt={`${label} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex">
              <ImageIcon className="h-4 w-4 text-zinc-200" />
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <Lightbox
          urls={urls}
          index={openIndex}
          label={label}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}

function Lightbox({
  urls,
  index,
  label,
  onClose,
  onIndexChange,
}: {
  urls: string[];
  index: number;
  label: string;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % urls.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + urls.length) % urls.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, urls.length, onClose, onIndexChange]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex w-full max-w-3xl items-center justify-center">
        {urls.length > 1 && (
          <button
            onClick={() => onIndexChange((index - 1 + urls.length) % urls.length)}
            className={cn(
              "absolute left-0 z-10 flex h-9 w-9 items-center justify-center rounded-full",
              "bg-zinc-900/80 text-zinc-300 hover:text-zinc-100"
            )}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        <img
          src={urls[index]}
          alt={`${label} ${index + 1}`}
          className="max-h-[80vh] max-w-full rounded-md object-contain"
        />

        {urls.length > 1 && (
          <button
            onClick={() => onIndexChange((index + 1) % urls.length)}
            className={cn(
              "absolute right-0 z-10 flex h-9 w-9 items-center justify-center rounded-full",
              "bg-zinc-900/80 text-zinc-300 hover:text-zinc-100"
            )}
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {urls.length > 1 && (
        <p className="mt-3 text-xs text-zinc-500">
          {index + 1} / {urls.length}
        </p>
      )}
    </div>
  );
}
