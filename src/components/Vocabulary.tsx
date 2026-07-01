// The 80 COCO classes the YOLOS models are trained on. The detector always maps
// what it sees to the closest of these, so anything outside the list (footwear,
// for instance) gets mislabeled.
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck',
  'boat', 'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra',
  'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
  'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove',
  'skateboard', 'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup',
  'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich', 'orange',
  'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
  'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier',
  'toothbrush',
];

export default function Vocabulary() {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm leading-relaxed text-muted">
        Trained on 80 everyday object types (people, laptops, cups, chairs, phones,
        bottles and similar). It always labels the closest match it knows, so
        anything outside that list (shoes, for example) comes out wrong.
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-signal transition hover:brightness-110">
          What it can detect ({COCO_CLASSES.length} classes)
        </summary>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {COCO_CLASSES.map((label) => (
            <li
              key={label}
              className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] text-fg"
            >
              {label}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
