import { useEffect, useRef, useState } from 'react';
import CameraStage from './components/CameraStage';
import StatsPanel from './components/StatsPanel';
import Controls from './components/Controls';
import {
  loadDetector,
  detectFrame,
  getBackend,
  MODEL_ID,
  type Backend,
  type Detection,
} from './lib/detector';
import { colorForLabel } from './lib/colors';

export type Status = 'idle' | 'loading' | 'ready' | 'running' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [backend, setBackend] = useState<Backend>('wasm');
  const [fps, setFps] = useState(0);
  const [inferenceMs, setInferenceMs] = useState(0);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [threshold, setThreshold] = useState(0.5);
  const [mirror, setMirror] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const latestRef = useRef<Detection[]>([]);
  const fpsStampsRef = useRef<number[]>([]);
  const thresholdRef = useRef(threshold);
  const detectorRef = useRef<Awaited<ReturnType<typeof loadDetector>> | null>(null);

  function getCaptureCanvas(): HTMLCanvasElement {
    if (!captureRef.current) captureRef.current = document.createElement('canvas');
    return captureRef.current;
  }

  // Keep the loop reading the latest threshold without re-binding.
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  function drawOverlay(dets: Detection[]) {
    const video = videoRef.current;
    const canvas = overlayRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, w, h);
    const lineWidth = Math.max(2, Math.round(w / 320));
    const fontSize = Math.max(13, Math.round(w / 42));
    ctx.lineWidth = lineWidth;
    ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';

    for (const d of dets) {
      const color = colorForLabel(d.label);
      const { xmin, ymin, xmax, ymax } = d.box;
      const bw = xmax - xmin;
      const bh = ymax - ymin;

      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.roundRect(xmin, ymin, bw, bh, Math.min(12, bw / 8));
      ctx.stroke();

      const text = `${d.label} ${Math.round(d.score * 100)}%`;
      const pad = fontSize * 0.4;
      const chipW = ctx.measureText(text).width + pad * 2;
      const chipH = fontSize + pad * 2;
      const chipY = ymin - chipH < 0 ? ymin : ymin - chipH;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(xmin, chipY, chipW, chipH, 6);
      ctx.fill();

      ctx.fillStyle = '#0b0d12';
      ctx.fillText(text, xmin + pad, chipY + pad);
    }
  }

  function renderLoop() {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (video && detector && !busyRef.current && video.readyState >= 2) {
      busyRef.current = true;
      const t0 = performance.now();
      detectFrame(detector, video, getCaptureCanvas(), thresholdRef.current)
        .then((dets) => {
          const t1 = performance.now();
          latestRef.current = dets;
          setInferenceMs(Math.round(t1 - t0));
          fpsStampsRef.current.push(t1);
          const cutoff = t1 - 1000;
          fpsStampsRef.current = fpsStampsRef.current.filter((t) => t > cutoff);
          setFps(fpsStampsRef.current.length);
          setDetections(dets);
        })
        .catch((err) => console.error('detection error:', err))
        .finally(() => {
          busyRef.current = false;
        });
    }

    drawOverlay(latestRef.current);
    rafRef.current = requestAnimationFrame(renderLoop);
  }

  async function start() {
    setError(null);
    try {
      // Kick off model load and camera at the same time.
      setStatus('loading');
      const detectorP = loadDetector((p) => setProgress(p));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      detectorRef.current = await detectorP;
      setBackend(getBackend());

      setStatus('running');
      busyRef.current = false;
      rafRef.current = requestAnimationFrame(renderLoop);
    } catch (err) {
      console.error(err);
      setError(describeError(err));
      setStatus('error');
      stopStream();
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    stopStream();
    latestRef.current = [];
    setDetections([]);
    setFps(0);
    const canvas = overlayRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setStatus(detectorRef.current ? 'ready' : 'idle');
  }

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopStream();
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 px-5 py-8 md:px-8">
      <Header backend={backend} running={status === 'running'} />

      <main className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <CameraStage
            videoRef={videoRef}
            overlayRef={overlayRef}
            status={status}
            progress={progress}
            mirror={mirror}
            error={error}
            onStart={start}
          />
          <Controls
            status={status}
            threshold={threshold}
            mirror={mirror}
            onStart={start}
            onStop={stop}
            onThreshold={setThreshold}
            onMirror={setMirror}
          />
        </div>

        <StatsPanel
          status={status}
          backend={backend}
          fps={fps}
          inferenceMs={inferenceMs}
          detections={detections}
        />
      </main>

      <HowItWorks />
      <Footer />
    </div>
  );
}

function Header({ backend, running }: { backend: Backend; running: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          on-device computer vision
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-fg md:text-4xl">
          Vision&nbsp;Live
        </h1>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5">
        <span
          className={`live-dot inline-block h-2 w-2 rounded-full ${running ? 'bg-signal' : 'bg-line'}`}
        />
        <span className="font-mono text-xs text-muted">
          {running ? `running on ${backend.toUpperCase()}` : 'idle'}
        </span>
      </div>
    </header>
  );
}

function HowItWorks() {
  const points: { k: string; title: string; body: string }[] = [
    {
      k: '01',
      title: 'Runs in the browser',
      body: 'The YOLOS model loads once and runs with WebGPU, falling back to WebAssembly when WebGPU is not available. Nothing to install.',
    },
    {
      k: '02',
      title: 'No backend',
      body: 'Inference happens on your machine, so the webcam feed is never uploaded and there is nothing to host or pay for.',
    },
    {
      k: '03',
      title: 'The stack',
      body: 'React 19, TypeScript and Vite, with Transformers.js (ONNX Runtime) doing inference and Tailwind for styling. Ships as static files.',
    },
  ];

  return (
    <section className="border-t border-line pt-6">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted">How it works</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {points.map((p) => (
          <div key={p.k} className="rounded-xl border border-line bg-surface p-4">
            <div className="font-mono text-sm text-signal">{p.k}</div>
            <h3 className="mt-1 font-display text-lg text-fg">{p.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 font-mono text-xs text-muted">
      <span>
        Model: <span className="text-fg">{MODEL_ID}</span>
      </span>
      <span>Built with Transformers.js, running client-side</span>
    </footer>
  );
}

function describeError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError')
    return 'Camera permission was denied. Allow access in your browser and try again.';
  if (name === 'NotFoundError') return 'No camera was found on this device.';
  if (!window.isSecureContext)
    return 'The camera needs a secure context. Use localhost during development or HTTPS in production.';
  return 'Could not start the camera or load the model. Check the console for details.';
}
