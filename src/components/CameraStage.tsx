import type { RefObject } from 'react';
import type { Status } from '../App';

interface CameraStageProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  status: Status;
  progress: number;
  mirror: boolean;
  error: string | null;
  onStart: () => void;
}

export default function CameraStage({
  videoRef,
  overlayRef,
  status,
  progress,
  mirror,
  error,
  onStart,
}: CameraStageProps) {
  const flip = mirror ? 'scaleX(-1)' : 'none';

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-line bg-black aspect-video">
      {/* Viewfinder corner brackets */}
      <span className="bracket tl" />
      <span className="bracket tr" />
      <span className="bracket bl" />
      <span className="bracket br" />

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: flip }}
        playsInline
        muted
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: flip }}
      />

      {/* Idle / loading / error overlays */}
      {status !== 'running' && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-4 bg-black/70 px-6 text-center backdrop-blur-sm">
          {status === 'idle' && (
            <>
              <p className="max-w-sm font-display text-lg text-fg">
                Point the camera at something and watch the model label it in real time.
              </p>
              <button
                onClick={onStart}
                className="rounded-lg bg-signal px-5 py-2.5 font-mono text-sm font-semibold text-ink transition hover:brightness-110"
              >
                Start camera
              </button>
              <p className="font-mono text-xs text-muted">
                The video never leaves your device.
              </p>
            </>
          )}

          {status === 'loading' && (
            <>
              <p className="font-mono text-sm text-fg">Loading model...</p>
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-signal transition-[width] duration-200"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
              <p className="font-mono text-xs text-muted">
                {progress > 0 ? `${Math.round(progress)}% downloaded` : 'Starting up'}. Cached
                after the first run.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="font-display text-lg text-signal">Camera unavailable</p>
              <p className="max-w-sm font-mono text-xs text-muted">{error}</p>
              <button
                onClick={onStart}
                className="rounded-lg border border-line px-4 py-2 font-mono text-sm text-fg transition hover:border-signal"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
