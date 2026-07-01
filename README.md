# Vision Live

Real-time object detection that runs in the browser. A YOLOS model loads once,
gets cached, and runs locally with WebGPU (with a WebAssembly fallback) through
[Transformers.js](https://github.com/huggingface/transformers.js). The webcam
feed stays on your machine, so there's no backend or API key to wire up.

**Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, and Transformers.js (ONNX Runtime).

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The camera needs a
secure context, which `localhost` already provides. The first run downloads the
model (a few tens of MB); after that it's cached and works offline.

## Build

```bash
npm run build      # type-checks, then bundles to /dist
npm run preview    # serves the production build locally
```

> If `npm install` fails while building the native ONNX binaries (you'll see an
> `onnxruntime-node` / CUDA message), it's safe to skip them. This app only uses
> the browser runtime: `npm install --ignore-scripts`.

## Deploy

The output in `dist/` is static, so any static host works:

- **Vercel, Netlify or Cloudflare Pages:** connect the repo, build command
  `npm run build`, output directory `dist`. The camera works because they serve over HTTPS.
- **GitHub Pages:** set `base` in `vite.config.ts` to your repo name
  (for example `base: '/vision-live/'`), then deploy the `dist/` folder.

## How it works

1. `getUserMedia` opens the webcam (frames stay local).
2. Each frame is drawn to an offscreen canvas and passed to the detection pipeline.
3. The model returns boxes, labels and scores, which get drawn on an overlay canvas.
4. A new inference only starts once the previous one finishes, so the UI never blocks.

Most of the logic lives in `src/lib/detector.ts` (model and inference) and
`src/App.tsx` (camera, loop, overlay drawing).

## Roadmap

Ideas I want to add next:

- [ ] Snapshot button and a gallery of captured detections
- [ ] A segmentation / background-removal model using the same on-device approach
- [ ] Save snapshots to a free Supabase or Neon project for the full-stack layer
- [ ] Model picker (tiny vs. larger detector) with a speed/accuracy note
- [ ] Pose or hand tracking as a second mode

---

Built by Maikel. On-device ML demo, runs entirely client-side.
