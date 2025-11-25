import { useState, useEffect, useCallback } from 'react'
import { autoComposer, type ComposerMode, type NoteEvent } from '../services/autoComposer'
import { moodSequencer } from '../services/sequencer'
import type { MoodAnalysis, AudioParameters } from '../types'
import './AutoComposer.css'

interface AutoComposerProps {
  mood: MoodAnalysis
  audioParams: AudioParameters
}

const MODES: { id: ComposerMode; label: string; icon: string }[] = [
  { id: 'melody', label: '멜로디', icon: '🎵' },
  { id: 'arpeggio', label: '아르페지오', icon: '🎶' },
  { id: 'ambient', label: '앰비언트', icon: '🌊' },
  { id: 'fullBand', label: '풀밴드', icon: '🎸' }
]

export default function AutoComposer({ mood, audioParams }: AutoComposerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(true)
  const [currentMode, setCurrentMode] = useState<ComposerMode>('melody')
  const [currentNote, setCurrentNote] = useState<string | null>(null)
  const [bars, setBars] = useState(4)

  // Generate and load new sequence
  const generateNewSequence = useCallback(() => {
    const sequence = autoComposer.generateSequence(
      mood,
      audioParams.scale,
      audioParams.tempo,
      bars,
      currentMode
    )
    moodSequencer.loadSequence(sequence)
    moodSequencer.setLooping(isLooping)
  }, [mood, audioParams, bars, currentMode, isLooping])

  // Handle play/stop toggle
  const handlePlayToggle = async () => {
    if (isPlaying) {
      moodSequencer.stop()
      setIsPlaying(false)
      setCurrentNote(null)
    } else {
      generateNewSequence()
      await moodSequencer.start()
      setIsPlaying(true)
    }
  }

  // Handle regenerate
  const handleRegenerate = () => {
    const wasPlaying = isPlaying
    moodSequencer.stop()
    generateNewSequence()
    if (wasPlaying) {
      moodSequencer.start()
    }
    setCurrentNote(null)
  }

  // Handle mode change
  const handleModeChange = (mode: ComposerMode) => {
    setCurrentMode(mode)
    if (isPlaying) {
      moodSequencer.stop()
      setIsPlaying(false)
      setCurrentNote(null)
    }
  }

  // Handle loop toggle
  const handleLoopToggle = () => {
    const newLooping = !isLooping
    setIsLooping(newLooping)
    moodSequencer.setLooping(newLooping)
  }

  // Note callback
  useEffect(() => {
    moodSequencer.onNotePlayed((note: NoteEvent) => {
      setCurrentNote(note.note)
      // Clear note display after duration
      setTimeout(() => setCurrentNote(null), 200)
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      moodSequencer.stop()
      moodSequencer.dispose()
    }
  }, [])

  // Stop when mood changes
  useEffect(() => {
    if (isPlaying) {
      moodSequencer.stop()
      setIsPlaying(false)
      setCurrentNote(null)
    }
  }, [mood])

  return (
    <div className="auto-composer">
      <div className="composer-header">
        <h3 className="composer-title">AI 자동 작곡</h3>
        {currentNote && (
          <span className="current-note">{currentNote}</span>
        )}
      </div>

      <div className="composer-modes">
        {MODES.map(mode => (
          <button
            key={mode.id}
            className={`mode-button ${currentMode === mode.id ? 'active' : ''}`}
            onClick={() => handleModeChange(mode.id)}
            title={mode.label}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>

      <div className="composer-controls">
        <button
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayToggle}
          title={isPlaying ? '정지' : '재생'}
        >
          {isPlaying ? '⏹' : '▶'}
        </button>

        <button
          className="regenerate-button"
          onClick={handleRegenerate}
          title="새로 생성"
        >
          🔄
        </button>

        <button
          className={`loop-button ${isLooping ? 'active' : ''}`}
          onClick={handleLoopToggle}
          title={isLooping ? '반복 끄기' : '반복 켜기'}
        >
          🔁
        </button>

        <div className="bars-control">
          <label>마디</label>
          <select
            value={bars}
            onChange={(e) => setBars(Number(e.target.value))}
            disabled={isPlaying}
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={16}>16</option>
          </select>
        </div>
      </div>

      <div className="composer-info">
        <span className="tempo-display">
          ♩ = {audioParams.tempo} BPM
        </span>
      </div>
    </div>
  )
}
