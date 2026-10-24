// QR codes for a burden's share link — the church's Sunday poster, as
// expressPay's "Scan to Pay" decals and MoMo's QR checkout (REA, 2026-10-22),
// but pointing at the burden page so the giver still sees where the money goes.
// Only qrcode's core encoder is used: no canvas, no images.
import QRCode from 'qrcode/lib/core/qrcode.js'

// One SVG path for the dark modules, merging runs along each row.
export function qrSvgPath(text) {
  const { size, data } = QRCode.create(text, { errorCorrectionLevel: 'M' }).modules
  let d = ''
  for (let y = 0; y < size; y++) {
    let x = 0
    while (x < size) {
      if (!data[y * size + x]) { x++; continue }
      const start = x
      while (x < size && data[y * size + x]) x++
      d += `M${start} ${y}h${x - start}v1h-${x - start}z`
    }
  }
  return { size, d }
}
