import * as Tone from 'tone'

class AudioAnalyzer {
  private waveformAnalyser: Tone.Analyser | null = null
  private fftAnalyser: Tone.FFT | null = null
  private initialized = false

  initialize() {
    if (this.initialized) return

    // Waveform analyzer (time domain)
    this.waveformAnalyser = new Tone.Analyser('waveform', 256)

    // FFT analyzer (frequency domain)
    this.fftAnalyser = new Tone.FFT(64)

    this.initialized = true
  }

  // Connect to an audio source
  connect(source: Tone.ToneAudioNode) {
    if (!this.waveformAnalyser || !this.fftAnalyser) {
      this.initialize()
    }

    source.connect(this.waveformAnalyser!)
    source.connect(this.fftAnalyser!)
  }

  // Get waveform data (time domain) - values from -1 to 1
  getWaveform(): Float32Array {
    if (!this.waveformAnalyser) return new Float32Array(256)
    return this.waveformAnalyser.getValue() as Float32Array
  }

  // Get frequency data (FFT) - values in dB
  getFrequencies(): Float32Array {
    if (!this.fftAnalyser) return new Float32Array(64)
    return this.fftAnalyser.getValue() as Float32Array
  }

  // Get RMS amplitude (loudness)
  getAmplitude(): number {
    const waveform = this.getWaveform()
    let sum = 0
    for (let i = 0; i < waveform.length; i++) {
      sum += waveform[i] * waveform[i]
    }
    return Math.sqrt(sum / waveform.length)
  }

  // Get peak amplitude
  getPeak(): number {
    const waveform = this.getWaveform()
    let peak = 0
    for (let i = 0; i < waveform.length; i++) {
      const abs = Math.abs(waveform[i])
      if (abs > peak) peak = abs
    }
    return peak
  }

  // Get frequency band averages (bass, mid, treble)
  getFrequencyBands(): { bass: number; mid: number; treble: number } {
    const frequencies = this.getFrequencies()
    const len = frequencies.length

    // Divide into thirds (bass, mid, treble)
    const bassEnd = Math.floor(len / 3)
    const midEnd = Math.floor((len * 2) / 3)

    let bassSum = 0, midSum = 0, trebleSum = 0

    for (let i = 0; i < len; i++) {
      // Convert dB to linear (roughly)
      const value = Math.max(0, (frequencies[i] + 100) / 100)

      if (i < bassEnd) {
        bassSum += value
      } else if (i < midEnd) {
        midSum += value
      } else {
        trebleSum += value
      }
    }

    return {
      bass: bassSum / bassEnd,
      mid: midSum / (midEnd - bassEnd),
      treble: trebleSum / (len - midEnd)
    }
  }

  getAnalyser(): Tone.Analyser | null {
    return this.waveformAnalyser
  }

  dispose() {
    if (this.waveformAnalyser) this.waveformAnalyser.dispose()
    if (this.fftAnalyser) this.fftAnalyser.dispose()
    this.initialized = false
  }
}

// Singleton instance
export const audioAnalyzer = new AudioAnalyzer()
