// qrcode ships no types; only its core encoder is used (src/lib/qr.ts).
declare module 'qrcode/lib/core/qrcode' {
  const QRCode: {
    create(text: string, options?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): {
      modules: { size: number; data: Uint8Array };
    };
  };
  export default QRCode;
}
