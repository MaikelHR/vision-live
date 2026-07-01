import type { Status } from '../App';
import { MODELS } from '../lib/detector';

interface ControlsProps {
  status: Status;
  threshold: number;
  mirror: boolean;
  modelId: string;
  switchingModel: boolean;
  onStart: () => void;
  onStop: () => void;
  onThreshold: (value: number) => void;
  onMirror: (value: boolean) => void;
  onSnapshot: () => void;
  onModel: (id: string) => void;
}

export default function Controls({
  status,
  threshold,
  mirror,
  modelId,
  switchingModel,
  onStart,
  onStop,
  onThreshold,
  onMirror,
  onSnapshot,
  onModel,
}: ControlsProps) {
  const running = status === 'running';
  const busy = status === 'loading';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4">
      {running ? (
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            className="rounded-lg border border-line px-4 py-2 font-mono text-sm font-semibold text-fg transition hover:border-signal"
          >
            Stop
          </button>
          <button
            onClick={onSnapshot}
            title="Capture snapshot"
            className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 font-mono text-sm font-semibold text-fg transition hover:border-signal"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Snapshot
          </button>
        </div>
      ) : (
        <button
          onClick={onStart}
          disabled={busy}
          className="rounded-lg bg-signal px-4 py-2 font-mono text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? 'Loading...' : 'Start camera'}
        </button>
      )}

      <label className="flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          Confidence
        </span>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.05}
          value={threshold}
          onChange={(e) => onThreshold(Number(e.target.value))}
          className="w-32"
        />
        <span className="w-9 font-mono text-xs text-fg">{Math.round(threshold * 100)}%</span>
      </label>

      <label className="flex cursor-pointer items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={mirror}
          onChange={(e) => onMirror(e.target.checked)}
          className="accent-[var(--color-signal)]"
        />
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Mirror</span>
      </label>

      <label className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Model</span>
        <select
          value={modelId}
          onChange={(e) => onModel(e.target.value)}
          disabled={busy || switchingModel}
          className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 font-mono text-xs text-fg outline-none transition hover:border-signal disabled:opacity-50"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.note})
            </option>
          ))}
        </select>
        {switchingModel && <span className="font-mono text-xs text-muted">loading...</span>}
      </label>
    </div>
  );
}
