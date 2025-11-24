import type { MoodAnalysis, AudioParameters } from '../types'

// Musical scales for different moods
const SCALES = {
  happy: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], // C Major
  sad: ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5'], // C Minor
  calm: ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'], // Pentatonic
  energetic: ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5'], // Lydian
  angry: ['C4', 'Db4', 'E4', 'F4', 'Gb4', 'A4', 'Bb4', 'C5'] // Diminished-like
}

// Chord intervals for rich harmonies (scale degree offsets from root)
// Each array represents which scale degrees to include in the chord
const CHORD_INTERVALS = {
  happy: [0, 2, 4, 6, 8],      // Major 9th: Root, 3rd, 5th, 7th, 9th
  sad: [0, 2, 4, 6],           // Minor 7th: Root, minor 3rd, 5th, minor 7th
  calm: [0, 2, 4, 5],          // Pentatonic voicing: Root, 3rd, 5th, octave
  energetic: [0, 2, 4, 6, 8],  // Major 9th: Root, 3rd, 5th, 7th, 9th
  angry: [0, 2, 4, 5]          // Diminished-like: Root, minor 3rd, dim 5th, 6th
}

// Synth types for moods
const SYNTH_TYPES = {
  happy: 'sine' as const,
  sad: 'sine' as const,
  calm: 'triangle' as const,
  energetic: 'sawtooth' as const,
  angry: 'square' as const
}

export function mapMoodToAudio(mood: MoodAnalysis): AudioParameters {
  // 1. TEMPO - based on speed
  // Range: 60-180 BPM
  const tempo = 60 + mood.speed * 120

  // 2. SYNTH TYPE - based on mood category
  const synthType = SYNTH_TYPES[mood.mood]

  // 3. REVERB - increases with lower intensity (more space in calm moods)
  const reverb = 0.1 + (1 - mood.intensity) * 0.5

  // 4. FILTER CUTOFF - based on brightness
  // Range: 200Hz (dark) to 5000Hz (bright)
  const filterCutoff = 200 + mood.brightness * 4800

  // 5. FILTER Q (RESONANCE) - based on texture and tension
  // Higher texture = more resonance for rich timbre
  // Higher tension = sharper peaks for edgy sound
  // Range: 1-8
  const filterQ = 1 + mood.texture * 4 + mood.tension * 3

  // 6. VOLUME - based on intensity
  const volume = 0.3 + mood.intensity * 0.5

  // 7. ENVELOPE - dynamic sound shaping
  const envelope = {
    // Attack: longer for complex textures (slow fade-in)
    attack: 0.005 + mood.texture * 0.5, // 0.005s to 0.505s

    // Decay: faster for energetic moods
    decay: 0.5 - mood.speed * 0.3, // 0.5s to 0.2s

    // Sustain: higher for intense moods
    sustain: 0.2 + mood.intensity * 0.6, // 0.2 to 0.8

    // Release: longer for complex textures (slow fade-out)
    release: 0.5 + mood.texture * 2.5 // 0.5s to 3s
  }

  // 8. CHORUS - adds richness for complex textures
  const chorus = {
    wet: mood.texture * 0.4, // 0 to 0.4 (subtle effect)
    frequency: 1.5, // LFO speed in Hz
    depth: 0.7 // Modulation depth
  }

  // 9. VIBRATO - pitch modulation for tension/unrest
  const vibrato = {
    depth: mood.tension * 0.5, // 0 to 0.5 semitones
    frequency: 4 + mood.tension * 4 // 4Hz to 8Hz
  }

  // 10. DISTORTION - harmonic saturation for high tension
  const distortion = mood.tension * 0.3 // 0 to 0.3

  // 11. MUSICAL SCALE - based on mood category
  const scale = SCALES[mood.mood]

  // 12. CHORD INTERVALS - for automatic harmony generation
  const chordIntervals = CHORD_INTERVALS[mood.mood]

  return {
    tempo,
    synthType,
    reverb,
    filterCutoff,
    filterQ,
    volume,
    scale,
    chordIntervals,
    envelope,
    chorus,
    vibrato,
    distortion
  }
}

// Helper function to get mood description in Korean
export function getMoodDescription(mood: MoodAnalysis): string {
  const moodNames = {
    happy: '행복',
    sad: '슬픔',
    calm: '평온',
    energetic: '활기찬',
    angry: '화남'
  }

  const intensityDesc = mood.intensity > 0.7 ? '매우' : mood.intensity > 0.4 ? '보통' : '약간'

  return `${intensityDesc} ${moodNames[mood.mood]}`
}
