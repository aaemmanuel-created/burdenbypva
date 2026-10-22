// QR codes for a burden's share link — the church's Sunday poster, as
// expressPay's "Scan to Pay" decals and MoMo's QR checkout (REA, 2026-10-22),
// but pointing at the burden page so the giver still sees where the money goes.
// Only qrcode's core encoder is used (pure JS, works in Expo Go).
// Mirrors burden-app/src/lib/qr.js.
import QRCode from 'qrcode/lib/core/qrcode';

export type QrRun = { x: number; y: number; w: number };

// Dark modules as horizontal runs, one View each when drawn.
export function qrRuns(text: string): { size: number; runs: QrRun[] } {
  const { size, data } = QRCode.create(text, { errorCorrectionLevel: 'M' }).modules;
  const runs: QrRun[] = [];
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) { x++; continue; }
      const start = x;
      while (x < size && data[y * size + x]) x++;
      runs.push({ x: start, y, w: x - start });
    }
  }
  return { size, runs };
}
