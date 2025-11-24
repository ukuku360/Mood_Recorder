// Mood types
export type MoodType = 'happy' | 'sad' | 'calm' | 'energetic' | 'angry'

// Mood analysis result from LLM
export interface MoodAnalysis {
  mood: MoodType
  intensity: number // 0-1: How strong the emotion is
  brightness: number // 0-1: How positive/light the mood is
  speed: number // 0-1: Energy/urgency level
  texture: number // 0-1: Complexity/richness of emotion (simple to layered)
  tension: number // 0-1: Psychological tension/dissonance (relaxed to tense)
}

// Audio parameters that will be controlled by mood
export interface AudioParameters {
  tempo: number // BPM (60-180)
  synthType: 'sine' | 'square' | 'sawtooth' | 'triangle'
  reverb: number // 0-1
  filterCutoff: number // Hz (200-5000)
  filterQ: number // Filter resonance (1-8)
  volume: number // 0-1
  scale: string[] // Musical scale notes
  chordIntervals: number[] // Scale degree intervals for chord generation
  // Envelope parameters
  envelope: {
    attack: number // seconds
    decay: number // seconds
    sustain: number // 0-1
    release: number // seconds
  }
  // Modulation effects
  chorus: {
    wet: number // 0-1
    frequency: number // Hz
    depth: number // 0-1
  }
  vibrato: {
    depth: number // semitones
    frequency: number // Hz
  }
  distortion: number // 0-1
}

// Keyboard event with timing
export interface KeyboardNote {
  key: string
  timestamp: number
  pitch: string // Musical note like 'C4', 'D4', etc.
}
