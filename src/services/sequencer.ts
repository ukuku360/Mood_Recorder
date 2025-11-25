import * as Tone from 'tone'
import { audioEngine } from './audioEngine'
import type { GeneratedSequence, NoteEvent } from './autoComposer'

type SequencerCallback = (note: NoteEvent) => void

class MoodSequencer {
  private melodyPart: Tone.Part | null = null
  private bassPart: Tone.Part | null = null
  private isPlaying = false
  private looping = false
  private currentSequence: GeneratedSequence | null = null
  private onNoteCallback: SequencerCallback | null = null

  // Load a generated sequence
  loadSequence(sequence: GeneratedSequence): void {
    this.stop()
    this.dispose()

    this.currentSequence = sequence

    // Set tempo
    Tone.Transport.bpm.value = sequence.tempo

    // Create melody part
    if (sequence.melody.length > 0) {
      this.melodyPart = new Tone.Part((_time, value) => {
        const event = value as NoteEvent
        audioEngine.playNote(event.note, event.duration)
        this.onNoteCallback?.(event)
      }, sequence.melody.map(note => [note.time, note]))

      this.melodyPart.loop = this.looping
      if (this.looping) {
        this.melodyPart.loopEnd = `${Math.ceil(sequence.totalDuration)}m`
      }
    }

    // Create bass part
    if (sequence.bassLine.length > 0) {
      this.bassPart = new Tone.Part((_time, value) => {
        const event = value as NoteEvent
        audioEngine.playNote(event.note, event.duration)
      }, sequence.bassLine.map(note => [note.time, note]))

      this.bassPart.loop = this.looping
      if (this.looping) {
        this.bassPart.loopEnd = `${Math.ceil(sequence.totalDuration)}m`
      }
    }
  }

  // Start playback
  async start(): Promise<void> {
    if (!this.currentSequence) return

    // Ensure audio context is running
    if (Tone.context.state !== 'running') {
      await Tone.start()
    }

    Tone.Transport.start()
    this.melodyPart?.start(0)
    this.bassPart?.start(0)
    this.isPlaying = true
  }

  // Stop playback
  stop(): void {
    Tone.Transport.stop()
    Tone.Transport.position = 0
    this.melodyPart?.stop()
    this.bassPart?.stop()
    this.isPlaying = false
    audioEngine.stop()
  }

  // Pause playback
  pause(): void {
    Tone.Transport.pause()
    this.isPlaying = false
    audioEngine.stop()
  }

  // Resume playback
  resume(): void {
    Tone.Transport.start()
    this.isPlaying = true
  }

  // Toggle play/pause
  toggle(): void {
    if (this.isPlaying) {
      this.pause()
    } else {
      if (Tone.Transport.state === 'paused') {
        this.resume()
      } else {
        this.start()
      }
    }
  }

  // Set looping
  setLooping(enabled: boolean): void {
    this.looping = enabled

    if (this.melodyPart) {
      this.melodyPart.loop = enabled
    }
    if (this.bassPart) {
      this.bassPart.loop = enabled
    }
  }

  // Set callback for note events
  onNotePlayed(callback: SequencerCallback): void {
    this.onNoteCallback = callback
  }

  // Check if playing
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  // Get current position
  getPosition(): number {
    const position = Tone.Transport.position
    if (typeof position === 'string') {
      // Parse "bars:beats:sixteenths" format
      const parts = position.split(':').map(Number)
      return parts[0] * 4 + parts[1] + parts[2] / 4
    }
    return 0
  }

  // Dispose resources
  dispose(): void {
    this.stop()
    this.melodyPart?.dispose()
    this.bassPart?.dispose()
    this.melodyPart = null
    this.bassPart = null
    this.currentSequence = null
  }
}

// Singleton instance
export const moodSequencer = new MoodSequencer()
