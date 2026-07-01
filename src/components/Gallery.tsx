import type { Snapshot } from '../App';

interface GalleryProps {
  snapshots: Snapshot[];
  onDownload: (snap: Snapshot) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function Gallery({ snapshots, onDownload, onRemove, onClear }: GalleryProps) {
  if (snapshots.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">
          Snapshots ({snapshots.length})
        </h2>
        <button
          onClick={onClear}
          className="font-mono text-xs text-muted transition hover:text-signal"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {snapshots.map((snap) => (
          <div
            key={snap.id}
            className="group relative overflow-hidden rounded-lg border border-line"
          >
            <button
              onClick={() => onDownload(snap)}
              title={`Download ${snap.filename}`}
              className="block w-full text-left"
            >
              <img
                src={snap.dataUrl}
                alt={snap.summary}
                className="aspect-video w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-xs font-semibold text-fg opacity-0 transition group-hover:opacity-100">
                Download
              </span>
              <span className="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-black/90 to-transparent px-2 py-1.5">
                <span className="block truncate font-mono text-[11px] text-fg">{snap.summary}</span>
                <span className="block font-mono text-[10px] text-muted">{snap.time}</span>
              </span>
            </button>
            <button
              onClick={() => onRemove(snap.id)}
              title="Remove"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 font-mono text-xs leading-none text-fg transition hover:bg-signal hover:text-ink"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
