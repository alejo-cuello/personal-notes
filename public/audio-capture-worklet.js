// AudioWorkletProcessor that forwards raw mono Float32 mic frames to the main thread.
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length > 0) {
      // Copy because the underlying buffer is reused across render quanta.
      this.port.postMessage(input[0].slice(0))
    }
    return true
  }
}

registerProcessor("capture-processor", CaptureProcessor)
