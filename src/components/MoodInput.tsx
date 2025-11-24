import './MoodInput.css'

interface MoodInputProps {
  onMoodAnalyzed: (input: string) => void
  isAnalyzing: boolean
}

export default function MoodInput({ onMoodAnalyzed, isAnalyzing }: MoodInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const input = formData.get('mood-text') as string
    if (input.trim()) {
      onMoodAnalyzed(input)
    }
  }

  return (
    <div className="mood-input">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="mood-text">지금 기분이 어떠신가요?</label>
          <textarea
            id="mood-text"
            name="mood-text"
            placeholder="예: 오늘 정말 행복해요! 좋은 일이 있었어요."
            rows={4}
            disabled={isAnalyzing}
          />
        </div>
        <button
          type="submit"
          disabled={isAnalyzing}
          className="analyze-button"
        >
          {isAnalyzing ? '분석 중...' : '기분 분석하기'}
        </button>
      </form>
    </div>
  )
}
