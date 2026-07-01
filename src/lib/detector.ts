import {
  pipeline,
  RawImage,
  env,
  type ObjectDetectionPipeline,
} from '@huggingface/transformers';

// No weights are bundled. Transformers.js pulls the ONNX model from the Hugging
// Face Hub on first run and caches it in the browser, so later loads work offline.
env.allowLocalModels = false;

// Small, fast object-detection model trained on the 80 COCO classes
// (person, laptop, cup, chair, phone, ...). ~tens of MB, cached after first run.
export const MODEL_ID = 'Xenova/yolos-tiny';

export type Backend = 'webgpu' | 'wasm';

export interface Detection {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

let detectorPromise: Promise<ObjectDetectionPipeline> | null = null;
let activeBackend: Backend = 'wasm';

function supportsWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

export function getBackend(): Backend {
  return activeBackend;
}

/**
 * Loads the detection model once and reuses it. WebGPU is used when available
 * (much faster), otherwise it falls back to WebAssembly on the CPU.
 */
export function loadDetector(
  onProgress?: (percent: number) => void,
): Promise<ObjectDetectionPipeline> {
  if (detectorPromise) return detectorPromise;

  const useWebGPU = supportsWebGPU();
  activeBackend = useWebGPU ? 'webgpu' : 'wasm';

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

  detectorPromise = createPipeline('object-detection', MODEL_ID, {
    device: useWebGPU ? 'webgpu' : 'wasm',
    progress_callback,
  });

  return detectorPromise;
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
  // RawImage from RGBA canvas data, then drop alpha -> RGB for the model.
  const image = new RawImage(new Uint8ClampedArray(data), w, h, 4).rgb();

  const output = (await detector(image, { threshold })) as Detection[];
  return output;
}
