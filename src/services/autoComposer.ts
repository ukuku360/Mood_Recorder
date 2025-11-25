import type { MoodAnalysis, MoodType } from '../types'

export interface NoteEvent {
  note: string
  duration: string
  time: number
  velocity: number
}

export interface GeneratedSequence {
  melody: NoteEvent[]
  bassLine: NoteEvent[]
  tempo: number
  totalDuration: number
}

export type ComposerMode = 'melody' | 'arpeggio' | 'ambient' | 'fullBand'

// Markov chain transition probabilities for each mood
// Maps from scale degree to next scale degree with probability weights
const MELODIC_TRANSITIONS: Record<MoodType, Record<number, Record<number, number>>> = {
  happy: {
    0: { 1: 0.3, 2: 0.25, 4: 0.25, 7: 0.15, '-1': 0.05 }, // Rest represented as -1
    1: { 2: 0.35, 0: 0.2, 3: 0.25, 4: 0.2 },
    2: { 3: 0.3, 4: 0.25, 1: 0.2, 0: 0.15, '-1': 0.1 },
    3: { 4: 0.35, 2: 0.25, 5: 0.2, 1: 0.2 },
    4: { 5: 0.3, 3: 0.25, 6: 0.2, 2: 0.15, '-1': 0.1 },
    5: { 6: 0.3, 4: 0.3, 7: 0.2, 3: 0.2 },
    6: { 7: 0.4, 5: 0.3, 4: 0.2, '-1': 0.1 },
    7: { 0: 0.35, 6: 0.25, 5: 0.2, '-1': 0.2 }
  },
  sad: {
    0: { 1: 0.15, 2: 0.2, '-1': 0.25, 7: 0.2, 6: 0.2 },
    1: { 0: 0.3, 2: 0.25, '-1': 0.2, 7: 0.25 },
    2: { 1: 0.35, 0: 0.25, 3: 0.2, '-1': 0.2 },
    3: { 2: 0.35, 4: 0.25, 1: 0.2, '-1': 0.2 },
    4: { 3: 0.35, 5: 0.2, 2: 0.25, '-1': 0.2 },
    5: { 4: 0.35, 3: 0.25, 6: 0.2, '-1': 0.2 },
    6: { 5: 0.35, 7: 0.2, 4: 0.25, '-1': 0.2 },
    7: { 6: 0.3, 0: 0.25, '-1': 0.25, 5: 0.2 }
  },
  calm: {
    0: { 2: 0.3, 4: 0.3, '-1': 0.2, 1: 0.2 },
    1: { 2: 0.35, 0: 0.3, '-1': 0.2, 4: 0.15 },
    2: { 4: 0.35, 0: 0.25, '-1': 0.25, 1: 0.15 },
    3: { 2: 0.3, 4: 0.3, 0: 0.2, '-1': 0.2 },
    4: { 2: 0.3, 0: 0.3, '-1': 0.25, 5: 0.15 },
    5: { 4: 0.35, 2: 0.25, '-1': 0.25, 0: 0.15 },
    6: { 4: 0.35, 2: 0.25, '-1': 0.2, 0: 0.2 },
    7: { 0: 0.4, 4: 0.25, '-1': 0.2, 2: 0.15 }
  },
  energetic: {
    0: { 2: 0.25, 4: 0.3, 7: 0.25, 1: 0.2 },
    1: { 3: 0.3, 4: 0.3, 2: 0.25, 0: 0.15 },
    2: { 4: 0.35, 5: 0.25, 0: 0.2, 3: 0.2 },
    3: { 5: 0.35, 4: 0.25, 6: 0.2, 1: 0.2 },
    4: { 6: 0.3, 7: 0.3, 2: 0.2, 5: 0.2 },
    5: { 7: 0.35, 6: 0.25, 4: 0.2, 3: 0.2 },
    6: { 7: 0.4, 4: 0.25, 5: 0.2, 0: 0.15 },
    7: { 0: 0.3, 4: 0.25, 2: 0.25, 6: 0.2 }
  },
  angry: {
    0: { 1: 0.2, 3: 0.25, 6: 0.25, 4: 0.2, '-1': 0.1 },
    1: { 0: 0.25, 3: 0.3, 6: 0.25, 4: 0.2 },
    2: { 1: 0.25, 3: 0.3, 0: 0.25, 6: 0.2 },
    3: { 4: 0.3, 6: 0.3, 1: 0.2, 0: 0.2 },
    4: { 3: 0.3, 6: 0.3, 0: 0.2, 1: 0.2 },
    5: { 6: 0.35, 4: 0.25, 3: 0.2, 0: 0.2 },
    6: { 0: 0.3, 4: 0.25, 3: 0.25, 7: 0.2 },
    7: { 6: 0.35, 0: 0.25, 4: 0.2, 3: 0.2 }
  }
}

// Rhythm patterns for each mood
const RHYTHM_PATTERNS: Record<MoodType, string[][]> = {
  happy: [
    ['4n', '8n', '8n', '4n', '4n'],
    ['4n', '4n', '8n', '8n', '4n'],
    ['8n', '8n', '4n', '4n', '4n']
  ],
  sad: [
    ['2n', '4n', '4n', '2n'],
    ['2n.', '4n', '2n'],
    ['1n', '2n']
  ],
  calm: [
    ['2n', '2n', '1n'],
    ['2n.', '4n', '2n', '2n'],
    ['1n', '1n']
  ],
  energetic: [
    ['8n', '8n', '8n', '8n', '4n', '4n'],
    ['16n', '16n', '8n', '8n', '4n', '4n'],
    ['8n', '4n', '8n', '4n', '4n']
  ],
  angry: [
    ['8n', '4n', '8n', '4n', '4n'],
    ['4n', '8n', '8n', '8n', '8n', '4n'],
    ['4n', '4n', '8n', '8n', '4n']
  ]
}

// Duration in beats for each note value
const DURATION_BEATS: Record<string, number> = {
  '1n': 4,
  '2n.': 3,
  '2n': 2,
  '4n.': 1.5,
  '4n': 1,
  '8n.': 0.75,
  '8n': 0.5,
  '16n': 0.25
}

class AutoComposer {
  // Select next note based on Markov chain probabilities
  private selectNextNote(currentDegree: number, mood: MoodType): number {
    const transitions = MELODIC_TRANSITIONS[mood][currentDegree] || MELODIC_TRANSITIONS[mood][0]
    const random = Math.random()
    let cumulative = 0

    for (const [degree, probability] of Object.entries(transitions)) {
      cumulative += probability
      if (random <= cumulative) {
        return parseInt(degree, 10)
      }
    }

    return 0 // Default to root
  }

  // Get note from scale degree
  private getNoteFromDegree(degree: number, scale: string[], octaveOffset: number = 0): string | null {
    if (degree === -1) return null // Rest

    const scaleLen = scale.length
    const adjustedDegree = ((degree % scaleLen) + scaleLen) % scaleLen
    const note = scale[adjustedDegree]

    if (octaveOffset !== 0) {
      const match = note.match(/^([A-G][b#]?)(\d+)$/)
      if (match) {
        const newOctave = parseInt(match[2], 10) + octaveOffset
        return `${match[1]}${newOctave}`
      }
    }

    return note
  }

  // Generate melody using Markov chain
  generateMelody(
    mood: MoodAnalysis,
    scale: string[],
    bars: number = 4,
    mode: ComposerMode = 'melody'
  ): NoteEvent[] {
    const melody: NoteEvent[] = []
    const beatsPerBar = 4
    const totalBeats = bars * beatsPerBar

    let currentBeat = 0
    let currentDegree = 0

    // Select rhythm pattern
    const patterns = RHYTHM_PATTERNS[mood.mood]
    let patternIndex = 0

    while (currentBeat < totalBeats) {
      const pattern = patterns[patternIndex % patterns.length]

      for (const duration of pattern) {
        if (currentBeat >= totalBeats) break

        const durationBeats = DURATION_BEATS[duration] || 1
        const nextDegree = this.selectNextNote(currentDegree, mood.mood)
        const note = this.getNoteFromDegree(nextDegree, scale)

        if (note) { // Not a rest
          const velocity = 0.5 + (Math.random() * 0.3 * mood.intensity)

          if (mode === 'arpeggio') {
            // Generate arpeggio pattern
            const arpeggioNotes = this.generateArpeggioNotes(nextDegree, scale, mood)
            const arpeggioTime = durationBeats / arpeggioNotes.length

            arpeggioNotes.forEach((arpNote, i) => {
              melody.push({
                note: arpNote,
                duration: '16n',
                time: currentBeat + (i * arpeggioTime),
                velocity
              })
            })
          } else {
            melody.push({
              note,
              duration,
              time: currentBeat,
              velocity
            })
          }
        }

        currentBeat += durationBeats
        currentDegree = nextDegree === -1 ? currentDegree : nextDegree
      }

      patternIndex++
    }

    return melody
  }

  // Generate arpeggio notes from a scale degree
  private generateArpeggioNotes(degree: number, scale: string[], mood: MoodAnalysis): string[] {
    const notes: string[] = []
    const intervals = mood.mood === 'sad' || mood.mood === 'angry'
      ? [0, 2, 4] // Minor-ish intervals
      : [0, 2, 4, 7] // Major-ish with octave

    for (const interval of intervals) {
      const note = this.getNoteFromDegree(degree + interval, scale)
      if (note) notes.push(note)
    }

    // Add some variation based on mood
    if (mood.mood === 'energetic') {
      notes.push(...notes.slice().reverse())
    }

    return notes
  }

  // Generate bass line
  generateBassLine(
    mood: MoodAnalysis,
    scale: string[],
    bars: number = 4
  ): NoteEvent[] {
    const bassLine: NoteEvent[] = []
    const beatsPerBar = 4

    // Bass plays root notes with occasional movement
    const bassNotes = [0, 4, 3, 4] // Common bass progression degrees

    for (let bar = 0; bar < bars; bar++) {
      const bassDegree = bassNotes[bar % bassNotes.length]
      const note = this.getNoteFromDegree(bassDegree, scale, -1) // One octave lower

      if (note) {
        // Main bass note
        bassLine.push({
          note,
          duration: mood.mood === 'energetic' ? '4n' : '2n',
          time: bar * beatsPerBar,
          velocity: 0.6 + (mood.intensity * 0.2)
        })

        // Add rhythmic variation for energetic moods
        if (mood.mood === 'energetic' && mood.speed > 0.5) {
          bassLine.push({
            note,
            duration: '4n',
            time: bar * beatsPerBar + 2,
            velocity: 0.5 + (mood.intensity * 0.2)
          })
        }
      }
    }

    return bassLine
  }

  // Generate complete sequence
  generateSequence(
    mood: MoodAnalysis,
    scale: string[],
    tempo: number,
    bars: number = 4,
    mode: ComposerMode = 'melody'
  ): GeneratedSequence {
    const melody = this.generateMelody(mood, scale, bars, mode)
    const bassLine = mode === 'fullBand' || mode === 'ambient'
      ? this.generateBassLine(mood, scale, bars)
      : []

    const beatsPerBar = 4
    const totalBeats = bars * beatsPerBar
    const totalDuration = (totalBeats / tempo) * 60 // Duration in seconds

    return {
      melody,
      bassLine,
      tempo,
      totalDuration
    }
  }
}

// Singleton instance
export const autoComposer = new AutoComposer()
