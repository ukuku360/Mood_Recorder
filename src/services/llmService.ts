import axios from 'axios'
import type { MoodAnalysis, MoodType } from '../types'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const VALID_MOODS: MoodType[] = ['happy', 'sad', 'calm', 'energetic', 'angry']

function isValidMoodType(mood: unknown): mood is MoodType {
  return typeof mood === 'string' && VALID_MOODS.includes(mood as MoodType)
}

function clampValue(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || isNaN(value)) return fallback
  return Math.max(0, Math.min(1, value))
}

export async function analyzeMood(userInput: string): Promise<MoodAnalysis> {
  if (!OPENAI_API_KEY) {
    console.warn('No API key found, using mock mood analysis')
    return getMockMoodAnalysis(userInput)
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a mood analyzer. Analyze the user's mood from their text and return ONLY a JSON object with this exact format:
{
  "mood": "happy" | "sad" | "calm" | "energetic" | "angry",
  "intensity": 0.0-1.0,
  "brightness": 0.0-1.0,
  "speed": 0.0-1.0,
  "texture": 0.0-1.0,
  "tension": 0.0-1.0
}

Definitions:
- mood: The primary emotional category
- intensity: How strong the emotion is (0=subtle, 1=very strong)
- brightness: How positive/light the mood is (0=dark, 1=bright)
- speed: How much energy/urgency (0=slow/calm, 1=fast/urgent)
- texture: Emotional complexity (0=simple/pure emotion, 1=complex/layered/mixed feelings)
- tension: Psychological tension/dissonance (0=relaxed/harmonious, 1=tense/anxious/restless)

Return ONLY the JSON, no additional text.`
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const content = response.data.choices[0].message.content
    const moodData = JSON.parse(content.trim())

    // Validate mood type, fallback to 'calm' if invalid
    const validatedMood = isValidMoodType(moodData.mood) ? moodData.mood : 'calm'

    return {
      mood: validatedMood,
      intensity: clampValue(moodData.intensity, 0.5),
      brightness: clampValue(moodData.brightness, 0.5),
      speed: clampValue(moodData.speed, 0.5),
      texture: clampValue(moodData.texture, 0.5),
      tension: clampValue(moodData.tension, 0.3)
    }
  } catch (error) {
    console.error('Error analyzing mood with LLM:', error)
    return getMockMoodAnalysis(userInput)
  }
}

// Fallback function for when API is not available
function getMockMoodAnalysis(userInput: string): MoodAnalysis {
  const lowerInput = userInput.toLowerCase()

  // Simple keyword-based mood detection
  if (lowerInput.includes('행복') || lowerInput.includes('기쁘') || lowerInput.includes('좋아') || lowerInput.includes('happy') || lowerInput.includes('joy')) {
    return { mood: 'happy', intensity: 0.8, brightness: 0.9, speed: 0.6, texture: 0.3, tension: 0.2 }
  } else if (lowerInput.includes('슬프') || lowerInput.includes('우울') || lowerInput.includes('sad') || lowerInput.includes('depressed')) {
    return { mood: 'sad', intensity: 0.7, brightness: 0.2, speed: 0.3, texture: 0.6, tension: 0.5 }
  } else if (lowerInput.includes('화') || lowerInput.includes('짜증') || lowerInput.includes('angry') || lowerInput.includes('frustrated')) {
    return { mood: 'angry', intensity: 0.8, brightness: 0.3, speed: 0.9, texture: 0.2, tension: 0.9 }
  } else if (lowerInput.includes('신나') || lowerInput.includes('흥분') || lowerInput.includes('energetic') || lowerInput.includes('excited')) {
    return { mood: 'energetic', intensity: 0.9, brightness: 0.8, speed: 0.95, texture: 0.4, tension: 0.3 }
  } else {
    return { mood: 'calm', intensity: 0.5, brightness: 0.6, speed: 0.4, texture: 0.5, tension: 0.1 }
  }
}
