import * as Tone from 'tone'
import type { AudioParameters } from '../types'
import { audioAnalyzer } from './audioAnalyzer'
import { audioRecorder } from './audioRecorder'
import { INSTRUMENTS, type InstrumentType } from './instruments'

type SynthType = Tone.PolySynth | Tone.MonoSynth

class AudioEngine {
  private synth: SynthType | null = null
  private reverb: Tone.Reverb | null = null
  private filter: Tone.Filter | null = null
  private chorus: Tone.Chorus | null = null
  private vibrato: Tone.Vibrato | null = null
  private distortion: Tone.Distortion | null = null
  private initialized = false
  private currentScale: string[] = []
  private currentChordIntervals: number[] = []
  private currentInstrument: InstrumentType = 'piano'

  async initialize() {
    if (this.initialized) return

    // Create synth with effects chain
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    })

    // Create filter
    this.filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 2000,
      Q: 1
    })

    // Create chorus effect (for texture/richness)
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0
    })
    this.chorus.start()

    // Create vibrato effect (for tension/modulation)
    this.vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0
    })

    // Create distortion effect (for tension/edge)
    this.distortion = new Tone.Distortion({
      distortion: 0.4,
      wet: 0
    })

    // Create reverb effect
    this.reverb = new Tone.Reverb({
      decay: 2,
      wet: 0.3
    })

    // Generate reverb impulse response (required for reverb to work)
    await this.reverb.generate()

    // Initialize audio analyzer
    audioAnalyzer.initialize()

    // Connect the audio chain:
    // Synth → Vibrato → Filter → Chorus → Distortion → Reverb → Output
    // Also connect Distortion → Analyzer for visualization
    this.synth.connect(this.vibrato)
    this.vibrato.connect(this.filter)
    this.filter.connect(this.chorus)
    this.chorus.connect(this.distortion)
    this.distortion.connect(this.reverb)
    this.reverb.toDestination()

    // Connect analyzer after distortion for visualization
    audioAnalyzer.connect(this.distortion)

    // Initialize audio recorder and connect reverb output
    await audioRecorder.initialize()
    const recorderDest = audioRecorder.getDestination()
    if (recorderDest) {
      this.reverb.connect(recorderDest)
    }

    await Tone.start()

    // Verify AudioContext is actually running
    console.log('Audio engine initialized, AudioContext state:', Tone.context.state)
    if (Tone.context.state !== 'running') {
      console.warn('AudioContext is not running:', Tone.context.state)
      console.warn('Audio will start on first user interaction (keyboard press)')
    }

    this.initialized = true
    console.log('Audio engine initialized successfully')
  }

  updateParameters(params: AudioParameters) {
    if (!this.synth || !this.reverb || !this.filter || !this.chorus || !this.vibrato || !this.distortion) return

    console.log('Updating audio parameters:', {
      tempo: params.tempo,
      synthType: params.synthType,
      reverb: params.reverb,
      filterCutoff: params.filterCutoff,
      filterQ: params.filterQ,
      volume: params.volume,
      envelope: params.envelope,
      chorus: params.chorus,
      vibrato: params.vibrato,
      distortion: params.distortion,
      scale: params.scale
    })

    // Update tempo
    Tone.Transport.bpm.value = params.tempo

    // Update synth type and envelope
    this.synth.set({
      oscillator: {
        type: params.synthType
      },
      envelope: {
        attack: params.envelope.attack,
        decay: params.envelope.decay,
        sustain: params.envelope.sustain,
        release: params.envelope.release
      }
    })

    // Update filter
    this.filter.frequency.value = params.filterCutoff
    this.filter.Q.value = params.filterQ

    // Update chorus (texture)
    this.chorus.wet.value = params.chorus.wet
    this.chorus.frequency.value = params.chorus.frequency
    // Note: Chorus depth cannot be changed dynamically in Tone.js v15

    // Update vibrato (tension)
    this.vibrato.depth.value = params.vibrato.depth
    this.vibrato.frequency.value = params.vibrato.frequency

    // Update distortion (tension)
    // Use wet to control distortion amount (0 = bypass, 1 = full distortion)
    this.distortion.wet.value = params.distortion

    // Update reverb
    this.reverb.wet.value = params.reverb

    // Update volume
    this.synth.volume.value = Tone.gainToDb(params.volume)

    // Store scale and chord intervals for note playing
    this.currentScale = params.scale
    this.currentChordIntervals = params.chordIntervals

    console.log('Audio parameters updated successfully')
  }

  // Helper function to transpose a note by octaves
  private transposeOctave(note: string, octaves: number): string {
    // Extract note name and octave number
    // Examples: "C4" → ["C", "4"], "Eb4" → ["Eb", "4"]
    const match = note.match(/^([A-G][b#]?)(\d+)$/)
    if (!match) return note

    const [, noteName, octaveStr] = match
    const currentOctave = parseInt(octaveStr, 10)
    const newOctave = currentOctave + octaves

    return `${noteName}${newOctave}`
  }

  // Generate chord notes based on root note index in scale
  private getChordNotes(rootIndex: number): string[] {
    if (this.currentScale.length === 0 || this.currentChordIntervals.length === 0) {
      return []
    }

    const chordNotes: string[] = []
    const scaleLength = this.currentScale.length

    // Add bass note (one octave below root)
    const rootNote = this.currentScale[rootIndex]
    const bassNote = this.transposeOctave(rootNote, -1)
    chordNotes.push(bassNote)

    // Build chord from intervals
    for (const interval of this.currentChordIntervals) {
      const scaleIndex = (rootIndex + interval) % scaleLength
      let note = this.currentScale[scaleIndex]

      // If interval wraps around scale, transpose up an octave
      const octavesUp = Math.floor((rootIndex + interval) / scaleLength)
      if (octavesUp > 0) {
        note = this.transposeOctave(note, octavesUp)
      }

      chordNotes.push(note)
    }

    return chordNotes
  }

  async playNote(note: string, duration: string = '8n'): Promise<boolean> {
    if (!this.synth || !this.initialized) {
      console.warn('Audio engine not initialized')
      return false
    }

    // Ensure AudioContext is running before playing
    // This handles cases where the context is suspended due to browser autoplay policies
    if (Tone.context.state !== 'running') {
      console.log('Resuming suspended AudioContext...')
      try {
        await Tone.start()
        console.log('AudioContext resumed successfully, state:', Tone.context.state)
      } catch (error) {
        console.error('Failed to resume AudioContext:', error)
        return false
      }
    }

    try {
      // Find the index of the note in the current scale
      const noteIndex = this.currentScale.indexOf(note)

      if (noteIndex === -1 || this.currentChordIntervals.length === 0) {
        // Fallback to single note if not in scale or no chord intervals
        console.log('Playing single note:', note)
        this.synth.triggerAttackRelease(note, duration)
      } else {
        // Generate and play full chord with bass
        const chordNotes = this.getChordNotes(noteIndex)
        console.log('Playing chord:', chordNotes)
        // PolySynth accepts array of notes, MonoSynth doesn't
        if ('releaseAll' in this.synth) {
          this.synth.triggerAttackRelease(chordNotes, duration)
        } else {
          // For MonoSynth, play only the root note
          this.synth.triggerAttackRelease(note, duration)
        }
      }
      return true
    } catch (error) {
      console.error('Error playing note:', error)
      return false
    }
  }

  // Map keyboard key to a note based on current scale
  keyToNote(key: string): string | null {
    if (this.currentScale.length === 0) {
      // Default scale if none set
      console.log('⚠️  No scale set, using default C major scale')
      this.currentScale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
    }

    console.log('🎼 Current scale:', this.currentScale)

    // Map keyboard rows to octaves
    const keyMap: { [key: string]: number } = {
      // Top row (numbers)
      '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7,
      // Second row
      'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5, 'u': 6, 'i': 7, 'o': 8,
      // Third row
      'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7, 'l': 8,
      // Fourth row
      'z': 0, 'x': 1, 'c': 2, 'v': 3, 'b': 4, 'n': 5, 'm': 6
    }

    const lowerKey = key.toLowerCase()
    const index = keyMap[lowerKey]

    console.log('🔍 Key mapping:', lowerKey, '→ index:', index)

    if (index !== undefined && index < this.currentScale.length) {
      const note = this.currentScale[index]
      console.log('✅ Found note:', note, 'at index:', index)
      return note
    }

    console.log('❌ Key not in keyMap or index out of range')
    return null
  }

  stop() {
    if (this.synth) {
      // releaseAll is only available on PolySynth
      if ('releaseAll' in this.synth) {
        this.synth.releaseAll()
      } else {
        // For MonoSynth, trigger release manually
        this.synth.triggerRelease()
      }
    }
  }

  // Change instrument
  async setInstrument(instrument: InstrumentType) {
    if (!this.initialized || !this.vibrato) return

    const config = INSTRUMENTS[instrument]

    // Dispose old synth
    if (this.synth) {
      this.synth.disconnect()
      this.synth.dispose()
    }

    // Create new synth based on instrument type
    switch (config.synthType) {
      case 'FMSynth':
        this.synth = new Tone.PolySynth(Tone.FMSynth, config.synthConfig as Partial<Tone.FMSynthOptions>)
        break
      case 'AMSynth':
        this.synth = new Tone.PolySynth(Tone.AMSynth, config.synthConfig as Partial<Tone.AMSynthOptions>)
        break
      case 'MonoSynth':
        this.synth = new Tone.MonoSynth(config.synthConfig as Partial<Tone.MonoSynthOptions>)
        break
      default:
        this.synth = new Tone.PolySynth(Tone.Synth, config.synthConfig as Partial<Tone.SynthOptions>)
    }

    // Reconnect to effects chain
    this.synth.connect(this.vibrato)

    this.currentInstrument = instrument
    console.log(`Instrument changed to: ${config.name}`)
  }

  getCurrentInstrument(): InstrumentType {
    return this.currentInstrument
  }

  getInstrumentEffectsPreset() {
    return INSTRUMENTS[this.currentInstrument].effectsPreset
  }

  dispose() {
    if (this.synth) this.synth.dispose()
    if (this.reverb) this.reverb.dispose()
    if (this.filter) this.filter.dispose()
    if (this.chorus) this.chorus.dispose()
    if (this.vibrato) this.vibrato.dispose()
    if (this.distortion) this.distortion.dispose()
    this.initialized = false
  }
}

// Singleton instance
export const audioEngine = new AudioEngine()
