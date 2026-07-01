import {
  pipeline,
  RawImage,
  env,
  type ObjectDetectionPipeline,
} from '@huggingface/transformers';

// No weights are bundled. Transformers.js pulls the ONNX model from the Hugging
// Face Hub on first run and caches it in the browser, so later loads work offline.
env.allowLocalModels = false;

export interface ModelOption {
  id: string;
  label: string;
  note: string;
}

// Object-detection models (80 COCO classes: person, laptop, cup, chair, phone, ...)
// available as ONNX for Transformers.js. Each downloads on first use, then caches.
export const MODELS: ModelOption[] = [
  { id: 'Xenova/yolos-tiny', label: 'YOLOS-tiny', note: 'fast, lighter' },
  { id: 'Xenova/yolos-small', label: 'YOLOS-small', note: 'slower, more accurate' },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export type Backend = 'webgpu' | 'wasm';

export interface Detection {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

export type Detail = 'speed' | 'balanced' | 'quality';

export const DEFAULT_DETAIL: Detail = 'balanced';

// Input-resolution presets. Fewer input pixels means much faster ViT inference,
// at the cost of missing smaller or distant objects. This only changes the image
// processor size; detections still come back in the original frame's coordinates,
// and it can be swapped live between frames without reloading the model.
const DETAIL_SIZES: Record<Detail, { shortest_edge: number; longest_edge: number }> = {
  speed: { shortest_edge: 256, longest_edge: 416 },
  balanced: { shortest_edge: 384, longest_edge: 640 },
  quality: { shortest_edge: 512, longest_edge: 864 },
};

export function applyDetail(detector: ObjectDetectionPipeline, detail: Detail): void {
  const ip = (detector as unknown as { processor?: { image_processor?: { size?: object } } })
    .processor?.image_processor;
  if (ip) ip.size = { ...DETAIL_SIZES[detail] };
}

// One cached pipeline per model id, so switching back to a loaded model is instant.
const detectorPromises = new Map<string, Promise<ObjectDetectionPipeline>>();
let activeBackend: Backend = 'wasm';

type GpuLike = { requestAdapter(): Promise<unknown> };

let backendPromise: Promise<Backend> | null = null;

// Just checking `navigator.gpu` isn't enough: it can exist while no adapter is
// actually available, in which case WebGPU init fails. So we request an adapter.
function probeBackend(): Promise<Backend> {
  if (backendPromise) return backendPromise;
  backendPromise = (async (): Promise<Backend> => {
    const gpu = (navigator as Navigator & { gpu?: GpuLike }).gpu;
    if (typeof navigator === 'undefined' || !gpu) return 'wasm';
    try {
      const adapter = await gpu.requestAdapter();
      return adapter ? 'webgpu' : 'wasm';
    } catch {
      return 'wasm';
    }
  })();
  return backendPromise;
}

/** Probes for a usable WebGPU adapter and remembers the result. */
export async function detectBackend(): Promise<Backend> {
  activeBackend = await probeBackend();
  return activeBackend;
}

export function getBackend(): Backend {
  return activeBackend;
}

/**
 * Loads a detection model and reuses it on later calls. WebGPU is used when
 * available (much faster), otherwise it falls back to WebAssembly on the CPU.
 */
export function loadDetector(
  modelId: string,
  onProgress?: (percent: number) => void,
): Promise<ObjectDetectionPipeline> {
  const cached = detectorPromises.get(modelId);
  if (cached) return cached;

  const progress_callback = (event: unknown) => {
    const e = event as { status?: string; progress?: number };
    if (e?.status === 'progress' && typeof e.progress === 'number') {
      onProgress?.(e.progress);
    }
  };

  // `pipeline` has a very large overload union; narrow it to the one task we use
  // so TypeScript doesn't choke trying to represent every possible return type.
  const createPipeline = pipeline as (
    task: 'object-detection',
    model: string,
    options?: Record<string, unknown>,
  ) => Promise<ObjectDetectionPipeline>;

  const promise = probeBackend()
    .then((backend) => {
      activeBackend = backend;
      return createPipeline('object-detection', modelId, {
        device: backend,
        progress_callback,
      });
    })
    .catch((err) => {
      // Don't keep a rejected promise cached, so the next attempt retries cleanly.
      detectorPromises.delete(modelId);
      throw err;
    });

  detectorPromises.set(modelId, promise);
  return promise;
}

/**
 * Grabs the current video frame, hands it to the model, and returns the
 * detections. Box coordinates come back in the frame's own pixel space.
 */
export async function detectFrame(
  detector: ObjectDetectionPipeline,
  video: HTMLVideoElement,
  captureCanvas: HTMLCanvasElement,
  threshold: number,
): Promise<Detection[]> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return [];

  captureCanvas.width = w;
  captureCanvas.height = h;
  const ctx = captureCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(video, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  // RawImage from RGBA canvas data, then drop alpha -> RGB for the model. `.rgb()`
  // copies into a fresh buffer, so we can hand it `data` directly without cloning.
  const image = new RawImage(data, w, h, 4).rgb();

  const output = (await detector(image, { threshold })) as Detection[];
  return output;
}
