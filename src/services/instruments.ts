export type InstrumentType = 'piano' | 'synthPad' | 'ambientPad' | 'strings' | 'electricPiano' | 'bass'

export interface EffectsPreset {
  reverbMultiplier: number
  chorusMultiplier: number
  filterOffset: number
  distortionMultiplier: number
}

export interface InstrumentConfig {
  name: string
  koreanName: string
  icon: string
  synthType: 'Synth' | 'FMSynth' | 'AMSynth' | 'MonoSynth'
  synthConfig: object
  effectsPreset: EffectsPreset
}

export const INSTRUMENTS: Record<InstrumentType, InstrumentConfig> = {
  piano: {
    name: 'Piano',
    koreanName: '피아노',
    icon: '🎹',
    synthType: 'Synth',
    synthConfig: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0.1, release: 1.5 }
    },
    effectsPreset: {
      reverbMultiplier: 1.2,
      chorusMultiplier: 0.3,
      filterOffset: 500,
      distortionMultiplier: 0.1
    }
  },
  synthPad: {
    name: 'Synth Pad',
    koreanName: '신스 패드',
    icon: '🎛️',
    synthType: 'FMSynth',
    synthConfig: {
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 2 }
    },
    effectsPreset: {
      reverbMultiplier: 1.5,
      chorusMultiplier: 0.8,
      filterOffset: 0,
      distortionMultiplier: 0.2
    }
  },
  ambientPad: {
    name: 'Ambient',
    koreanName: '앰비언트',
    icon: '🌊',
    synthType: 'AMSynth',
    synthConfig: {
      harmonicity: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.9, release: 4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 1, decay: 0.5, sustain: 0.9, release: 4 }
    },
    effectsPreset: {
      reverbMultiplier: 2.0,
      chorusMultiplier: 1.0,
      filterOffset: -300,
      distortionMultiplier: 0
    }
  },
  strings: {
    name: 'Strings',
    koreanName: '스트링',
    icon: '🎻',
    synthType: 'FMSynth',
    synthConfig: {
      harmonicity: 2,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.3, decay: 0.1, sustain: 0.7, release: 1.5 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.3, decay: 0.1, sustain: 0.7, release: 1.5 }
    },
    effectsPreset: {
      reverbMultiplier: 1.3,
      chorusMultiplier: 0.6,
      filterOffset: 200,
      distortionMultiplier: 0.05
    }
  },
  electricPiano: {
    name: 'E.Piano',
    koreanName: '일렉피아노',
    icon: '🎸',
    synthType: 'FMSynth',
    synthConfig: {
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.2 }
    },
    effectsPreset: {
      reverbMultiplier: 0.8,
      chorusMultiplier: 0.5,
      filterOffset: 300,
      distortionMultiplier: 0.15
    }
  },
  bass: {
    name: 'Bass',
    koreanName: '베이스',
    icon: '🎸',
    synthType: 'MonoSynth',
    synthConfig: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
      filterEnvelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.5,
        release: 0.8,
        baseFrequency: 200,
        octaves: 2
      }
    },
    effectsPreset: {
      reverbMultiplier: 0.3,
      chorusMultiplier: 0.2,
      filterOffset: -800,
      distortionMultiplier: 0.3
    }
  }
}

export const INSTRUMENT_LIST: InstrumentType[] = [
  'piano',
  'synthPad',
  'ambientPad',
  'strings',
  'electricPiano',
  'bass'
]
