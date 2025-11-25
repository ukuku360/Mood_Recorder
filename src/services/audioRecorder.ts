import * as Tone from 'tone'

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private recordingDestination: MediaStreamAudioDestinationNode | null = null
  private isRecording = false
  private recordingStartTime = 0

  // Initialize recording destination
  async initialize(): Promise<boolean> {
    try {
      // Create MediaStreamDestination from Tone.js context
      this.recordingDestination = Tone.context.createMediaStreamDestination()
      this.stream = this.recordingDestination.stream

      return true
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error)
      return false
    }
  }

  // Get the destination node to connect audio sources
  getDestination(): MediaStreamAudioDestinationNode | null {
    return this.recordingDestination
  }

  // Check if MediaRecorder is supported
  isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined'
  }

  // Start recording
  start(): boolean {
    if (!this.stream || this.isRecording) {
      console.warn('Cannot start recording: stream not ready or already recording')
      return false
    }

    try {
      this.audioChunks = []

      // Determine best supported MIME type
      const mimeType = this.getSupportedMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}

      this.mediaRecorder = new MediaRecorder(this.stream, options)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(100) // Collect data every 100ms
      this.isRecording = true
      this.recordingStartTime = Date.now()

      console.log('Recording started')
      return true
    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  // Stop recording and return the audio blob
  async stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        console.warn('Cannot stop recording: not recording')
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm'
        const blob = new Blob(this.audioChunks, { type: mimeType })
        this.isRecording = false
        console.log('Recording stopped, blob size:', blob.size)
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  // Get recording duration in milliseconds
  getRecordingDuration(): number {
    if (!this.isRecording) return 0
    return Date.now() - this.recordingStartTime
  }

  // Check if currently recording
  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  // Get supported MIME type
  private getSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return null
  }

  // Download recording as file
  downloadRecording(blob: Blob, filename: string = 'mood-recording'): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Create audio URL for playback
  createPlaybackUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  // Revoke playback URL
  revokePlaybackUrl(url: string): void {
    URL.revokeObjectURL(url)
  }

  dispose(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
    }
    this.mediaRecorder = null
    this.stream = null
    this.recordingDestination = null
    this.isRecording = false
  }
}

// Singleton instance
export const audioRecorder = new AudioRecorder()
