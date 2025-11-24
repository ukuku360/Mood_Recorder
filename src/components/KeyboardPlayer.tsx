import { useEffect, useState } from 'react'
import { audioEngine } from '../services/audioEngine'
import './KeyboardPlayer.css'

interface KeyboardPlayerProps {
  isActive: boolean
}

export default function KeyboardPlayer({ isActive }: KeyboardPlayerProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [lastNotes, setLastNotes] = useState<string[]>([])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = async (e: KeyboardEvent) => {
      console.log('🎹 Key pressed:', e.key)

      // Prevent repeated events when key is held
      if (e.repeat) {
        console.log('⏭️  Skipping repeat event')
        return
      }

      const key = e.key.toLowerCase()

      // Don't play if key is already pressed
      if (pressedKeys.has(key)) {
        console.log('⏭️  Key already pressed:', key)
        return
      }

      const note = audioEngine.keyToNote(key)
      console.log('🎵 Mapped key to note:', key, '→', note)

      if (note) {
        e.preventDefault()

        console.log('▶️  Playing note:', note)
        // Play note asynchronously to ensure AudioContext is resumed
        await audioEngine.playNote(note, '8n')
        console.log('✅ Note played successfully')

        // Update pressed keys
        setPressedKeys(prev => new Set(prev).add(key))

        // Update visual feedback
        setLastNotes(prev => {
          const newNotes = [...prev, note]
          // Keep only last 8 notes
          return newNotes.slice(-8)
        })
      } else {
        console.log('❌ No note mapped for key:', key)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      setPressedKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isActive, pressedKeys])

  if (!isActive) {
    return (
      <div className="keyboard-player inactive">
        <p>먼저 기분을 분석해주세요 👆</p>
      </div>
    )
  }

  return (
    <div className="keyboard-player">
      <div className="player-header">
        <h2>🎹 키보드로 연주하기</h2>
        <p>아무 키나 눌러서 음악을 만들어보세요</p>
      </div>

      <div className="keyboard-guide">
        <div className="key-row">
          <span>숫자 키</span>
          <div className="keys">1 2 3 4 5 6 7 8</div>
        </div>
        <div className="key-row">
          <span>윗줄</span>
          <div className="keys">Q W E R T Y U I O</div>
        </div>
        <div className="key-row">
          <span>중간줄</span>
          <div className="keys">A S D F G H J K L</div>
        </div>
        <div className="key-row">
          <span>아래줄</span>
          <div className="keys">Z X C V B N M</div>
        </div>
      </div>

      {lastNotes.length > 0 && (
        <div className="notes-display">
          <span className="notes-label">최근 음표:</span>
          <div className="notes">
            {lastNotes.map((note, i) => (
              <span
                key={i}
                className="note"
                style={{
                  opacity: 0.3 + (i / lastNotes.length) * 0.7
                }}
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
