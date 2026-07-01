// A small, theme-consistent palette. Each detected class gets a stable color
// so the same object keeps the same color frame across frames.
const PALETTE = [
  '#FF6B4A', // coral (primary signal)
  '#4DD0E1', // cyan
  '#FFD166', // amber
  '#A78BFA', // violet
  '#5EE6A8', // mint
  '#F49AC2', // pink
  '#7FB2FF', // sky
  '#E9EBF2', // near-white
];

export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
