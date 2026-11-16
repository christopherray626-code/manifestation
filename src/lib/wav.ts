/** 16-bit WAV bytes (mono or stereo), which every browser and phone plays and can speed up without changing pitch. */
export function wav(channels: Float32Array[], rate: number): ArrayBuffer {
  const n = channels.length;
  const frames = channels[0].length;
  const bytes = frames * n * 2;
  const buf = new ArrayBuffer(44 + bytes);
  const v = new DataView(buf);
  const text = (at: number, s: string) => [...s].forEach((ch, i) => v.setUint8(at + i, ch.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + bytes, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, n, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * n * 2, true);
  v.setUint16(32, n * 2, true);
  v.setUint16(34, 16, true);
  text(36, 'data');
  v.setUint32(40, bytes, true);
  // Int16Array is much faster than a DataView call per sample, which matters for hour-long tapes on a phone.
  const out = new Int16Array(buf, 44, frames * n);
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < n; c++) {
      const s = channels[c][i];
      out[i * n + c] = (s > 1 ? 1 : s < -1 ? -1 : s) * 0x7fff;
    }
  }
  return buf;
}
