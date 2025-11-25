import { useState, useEffect, useRef } from 'react'
import { audioRecorder } from '../services/audioRecorder'
import './RecordingControls.css'

interface RecordingControlsProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void
}

export default function RecordingControls({ onRecordingComplete }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Format duration as MM:SS
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle recording toggle
  const handleRecordToggle = async () => {
    if (isRecording) {
      // Stop recording
      const blob = await audioRecorder.stop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      if (blob && blob.size > 0) {
        setRecordedBlob(blob)
        const url = audioRecorder.createPlaybackUrl(blob)
        setPlaybackUrl(url)
        onRecordingComplete?.(blob, duration)
      }

      setIsRecording(false)
    } else {
      // Start recording
      setRecordedBlob(null)
      if (playbackUrl) {
        audioRecorder.revokePlaybackUrl(playbackUrl)
        setPlaybackUrl(null)
      }
      setDuration(0)

      const started = audioRecorder.start()
      if (started) {
        setIsRecording(true)
        // Update duration every 100ms
        intervalRef.current = setInterval(() => {
          setDuration(audioRecorder.getRecordingDuration())
        }, 100)
      }
    }
  }

  // Handle playback toggle
  const handlePlayToggle = () => {
    if (!audioRef.current || !playbackUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Handle download
  const handleDownload = () => {
    if (recordedBlob) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      audioRecorder.downloadRecording(recordedBlob, `mood-${timestamp}`)
    }
  }

  // Handle discard
  const handleDiscard = () => {
    if (playbackUrl) {
      audioRecorder.revokePlaybackUrl(playbackUrl)
    }
    setRecordedBlob(null)
    setPlaybackUrl(null)
    setDuration(0)
    setIsPlaying(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (playbackUrl) {
        audioRecorder.revokePlaybackUrl(playbackUrl)
      }
    }
  }, [playbackUrl])

  // Audio ended handler
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [playbackUrl])

  if (!audioRecorder.isSupported()) {
    return null
  }

  return (
    <div className="recording-controls">
      <div className="recording-main">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={handleRecordToggle}
          title={isRecording ? '녹음 중지' : '녹음 시작'}
        >
          {isRecording ? (
            <span className="stop-icon">■</span>
          ) : (
            <span className="record-icon">●</span>
          )}
        </button>

        <div className="recording-info">
          {isRecording ? (
            <>
              <span className="recording-indicator">● REC</span>
              <span className="recording-time">{formatDuration(duration)}</span>
            </>
          ) : recordedBlob ? (
            <span className="recording-time">{formatDuration(duration)}</span>
          ) : (
            <span className="recording-hint">녹음하기</span>
          )}
        </div>
      </div>

      {recordedBlob && playbackUrl && (
        <div className="recording-playback">
          <audio ref={audioRef} src={playbackUrl} />

          <button
            className="playback-button"
            onClick={handlePlayToggle}
            title={isPlaying ? '정지' : '재생'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            className="download-button"
            onClick={handleDownload}
            title="다운로드"
          >
            ⬇
          </button>

          <button
            className="discard-button"
            onClick={handleDiscard}
            title="삭제"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
