import type { MoodAnalysis } from '../types'
import { getMoodDescription } from '../services/moodMapper'
import './AudioVisualizer.css'

interface AudioVisualizerProps {
  mood: MoodAnalysis | null
  onReset: () => void
}

export default function AudioVisualizer({ mood, onReset }: AudioVisualizerProps) {
  if (!mood) return null

  const description = getMoodDescription(mood)

  // Mood-to-color mapping
  const moodColors = {
    happy: '#FFD700',      // Gold
    sad: '#4169E1',        // Royal Blue
    calm: '#90EE90',       // Light Green
    energetic: '#FF6347',  // Tomato Red
    angry: '#DC143C'       // Crimson
  }

  const moodColor = moodColors[mood.mood]

  // Calculate brightness-adjusted color for the orb glow
  const glowIntensity = 0.3 + mood.brightness * 0.7 // 0.3 to 1.0 based on brightness
  const orbOpacity = 0.6 + mood.intensity * 0.4 // 0.6 to 1.0 based on intensity

  return (
    <div className="audio-visualizer">
      <div className="mood-display">
        <div
          className="mood-orb"
          style={{
            transform: `scale(${0.85 + mood.intensity * 0.3})`,
            background: `radial-gradient(circle, ${moodColor}${Math.round(orbOpacity * 255).toString(16).padStart(2, '0')}, ${moodColor}40)`,
            boxShadow: `0 0 ${20 + mood.intensity * 30}px ${moodColor}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`,
            filter: `brightness(${0.7 + mood.brightness * 0.6})`
          }}
        />
        <div className="mood-info">
          <h3>{description}</h3>
          <div className="mood-stats">
            <div className="stat">
              <span className="stat-label">강도</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${mood.intensity * 100}%`,
                    background: `linear-gradient(90deg, ${moodColor}aa, ${moodColor})`
                  }}
                />
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">밝기</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${mood.brightness * 100}%`,
                    background: `linear-gradient(90deg, ${moodColor}aa, ${moodColor})`
                  }}
                />
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">속도</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${mood.speed * 100}%`,
                    background: `linear-gradient(90deg, ${moodColor}aa, ${moodColor})`
                  }}
                />
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">질감</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${mood.texture * 100}%`,
                    background: `linear-gradient(90deg, ${moodColor}aa, ${moodColor})`
                  }}
                />
              </div>
            </div>
            <div className="stat">
              <span className="stat-label">긴장감</span>
              <div className="stat-bar">
                <div
                  className="stat-fill"
                  style={{
                    width: `${mood.tension * 100}%`,
                    background: `linear-gradient(90deg, ${moodColor}aa, ${moodColor})`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <button className="reset-button" onClick={onReset}>
        🔄 새로운 기분 입력하기
      </button>
    </div>
  )
}
