import type { Status } from '../App';

interface ControlsProps {
  status: Status;
  threshold: number;
  mirror: boolean;
  onStart: () => void;
  onStop: () => void;
  onThreshold: (value: number) => void;
  onMirror: (value: boolean) => void;
}

export default function Controls({
  status,
  threshold,
  mirror,
  onStart,
  onStop,
  onThreshold,
  onMirror,
}: ControlsProps) {
  const running = status === 'running';
  const busy = status === 'loading';

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4">
      {running ? (
        <button
          onClick={onStop}
          className="rounded-lg border border-line px-4 py-2 font-mono text-sm font-semibold text-fg transition hover:border-signal"
        >
          Stop
        </button>
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
    </div>
  );
}
