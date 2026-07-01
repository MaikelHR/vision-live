import { useMemo } from 'react';
import type { Backend, Detection } from '../lib/detector';
import { colorForLabel } from '../lib/colors';

interface StatsPanelProps {
  status: string;
  backend: Backend;
  fps: number;
  inferenceMs: number;
  detections: Detection[];
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-mono text-lg font-semibold text-fg">{value}</div>
    </div>
  );
}

export default function StatsPanel({
  status,
  backend,
  fps,
  inferenceMs,
  detections,
}: StatsPanelProps) {
  // Collapse detections to the strongest score per class for the list.
  const classes = useMemo(() => {
    const best = new Map<string, number>();
    for (const d of detections) {
      best.set(d.label, Math.max(best.get(d.label) ?? 0, d.score));
    }
    return [...best.entries()].sort((a, b) => b[1] - a[1]);
  }, [detections]);

  const running = status === 'running';

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Telemetry</h2>
        <span className="flex items-center gap-1.5 font-mono text-xs text-fg">
          <span
            className={`live-dot inline-block h-2 w-2 rounded-full ${
              running ? 'bg-signal' : 'bg-line'
            }`}
          />
          {running ? 'live' : 'idle'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Readout label="Detections / s" value={running ? String(fps) : '-'} />
        <Readout label="Inference" value={running ? `${inferenceMs} ms` : '-'} />
        <Readout label="Backend" value={backend.toUpperCase()} />
        <Readout label="Server calls" value="0" />
      </div>

      <div className="flex-1">
        <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted">
          In view ({classes.length})
        </h3>
        {classes.length === 0 ? (
          <p className="font-mono text-xs text-muted">
            {running ? 'Nothing detected yet. Try a person, cup, phone or laptop.' : 'Start the camera to begin.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {classes.map(([label, score]) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: colorForLabel(label) }}
                />
                <span className="w-24 truncate font-mono text-xs text-fg">{label}</span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.round(score * 100)}%`, background: colorForLabel(label) }}
                  />
                </span>
                <span className="w-9 text-right font-mono text-xs text-muted">
                  {Math.round(score * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
