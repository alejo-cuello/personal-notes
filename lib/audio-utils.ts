// Audio helpers for the Gemini Live API.
// Input to Gemini: raw 16-bit PCM, 16kHz, little-endian, base64.
// Output from Gemini: raw 16-bit PCM, 24kHz, little-endian, base64.

export const INPUT_SAMPLE_RATE = 16000
export const OUTPUT_SAMPLE_RATE = 24000

// Convert a Float32Array (range -1..1) of mono audio at `fromRate` into
// base64-encoded 16-bit little-endian PCM resampled to INPUT_SAMPLE_RATE.
export function floatTo16BitPcmBase64(input: Float32Array, fromRate: number): string {
  const resampled = fromRate === INPUT_SAMPLE_RATE ? input : downsample(input, fromRate, INPUT_SAMPLE_RATE)

  const buffer = new ArrayBuffer(resampled.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < resampled.length; i++) {
    let s = Math.max(-1, Math.min(1, resampled[i]))
    s = s < 0 ? s * 0x8000 : s * 0x7fff
    view.setInt16(i * 2, s, true)
  }
  return arrayBufferToBase64(buffer)
}

// Decode base64 16-bit PCM into a Float32Array (range -1..1).
export function base64Pcm16ToFloat32(base64: string): Float32Array {
  const buffer = base64ToArrayBuffer(base64)
  const view = new DataView(buffer)
  const length = buffer.byteLength / 2
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    out[i] = view.getInt16(i * 2, true) / 0x8000
  }
  return out
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return input
  const ratio = fromRate / toRate
  const newLength = Math.round(input.length / ratio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetInput = 0
  while (offsetResult < newLength) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio)
    let accum = 0
    let count = 0
    for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
      accum += input[i]
      count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++
    offsetInput = nextOffsetInput
  }
  return result
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ""
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)))
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
