import { useState, useEffect } from 'react'
import './App.css'
import MoodInput from './components/MoodInput'
import AudioVisualizer from './components/AudioVisualizer'
import RealTimeVisualizer from './components/RealTimeVisualizer'
import KeyboardPlayer from './components/KeyboardPlayer'
import InstrumentSelector from './components/InstrumentSelector'
import RecordingControls from './components/RecordingControls'
import AutoComposer from './components/AutoComposer'
import ThemeToggle from './components/ThemeToggle'
import type { InstrumentType } from './services/instruments'
import type { AudioParameters } from './types'
import { useTheme } from './hooks/useTheme'
import { analyzeMood } from './services/llmService'
import { mapMoodToAudio } from './services/moodMapper'
import { audioEngine } from './services/audioEngine'
import * as Tone from 'tone'
import type { MoodAnalysis } from './types'

function App() {
  const [currentMood, setCurrentMood] = useState<MoodAnalysis | null>(null)
  const [audioParams, setAudioParams] = useState<AudioParameters | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('piano')
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    return () => {
      audioEngine.dispose()
    }
  }, [])

  const handleMoodInput = async (input: string) => {
    if (!input.trim()) return

    setIsAnalyzing(true)

    try {
      // Analyze mood using LLM
      const mood = await analyzeMood(input)
      setCurrentMood(mood)

      // Initialize audio engine if not already done (requires user interaction)
      if (!isAudioInitialized) {
        try {
          await audioEngine.initialize()
          setIsAudioInitialized(true)

          // Check AudioContext state
          console.log('Audio initialized, AudioContext state:', Tone.context.state)

          // Provide user feedback if audio context is suspended
          if (Tone.context.state !== 'running') {
            console.warn('AudioContext is suspended. Audio will start on first keyboard interaction.')
          }
        } catch (error) {
          console.error('Failed to initialize audio engine:', error)
          // Don't throw error - continue anyway so KeyboardPlayer can be rendered
          // Audio will be initialized on first key press
        }
      }

      // Map mood to audio parameters
      const params = mapMoodToAudio(mood)
      setAudioParams(params)

      // Update audio engine with new parameters
      audioEngine.updateParameters(params)
    } catch (error) {
      console.error('Error analyzing mood:', error)
      alert('기분 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleResetMood = () => {
    setCurrentMood(null)
    setAudioParams(null)
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleInstrumentChange = async (instrument: InstrumentType) => {
    setCurrentInstrument(instrument)
    await audioEngine.setInstrument(instrument)

    // Re-apply mood parameters with new instrument
    if (currentMood) {
      const params = mapMoodToAudio(currentMood)
      setAudioParams(params)
      audioEngine.updateParameters(params)
    }
  }

  return (
    <div className="app">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <header className="app-header">
        <h1>🎹 Mood Recorder</h1>
        <p>기분을 입력하고 키보드로 연주하세요</p>
      </header>

      <main className="app-main">
        <MoodInput
          onMoodAnalyzed={handleMoodInput}
          isAnalyzing={isAnalyzing}
        />

        {currentMood && audioParams ? (
          <>
            <RealTimeVisualizer mood={currentMood} isActive={true} />
            <AudioVisualizer mood={currentMood} onReset={handleResetMood} />
            <AutoComposer mood={currentMood} audioParams={audioParams} />
            <InstrumentSelector
              currentInstrument={currentInstrument}
              onInstrumentChange={handleInstrumentChange}
            />
            <RecordingControls />
            <KeyboardPlayer isActive={true} />
          </>
        ) : !isAnalyzing ? (
          <div className="placeholder">
            <p>👆 위에서 당신의 기분을 입력해주세요</p>
          </div>
        ) : null}
      </main>

      <footer className="app-footer">
        <p>💡 Tip: API 키를 .env 파일에 설정하면 더 정확한 분석이 가능합니다</p>
      </footer>
    </div>
  )
}

export default App
