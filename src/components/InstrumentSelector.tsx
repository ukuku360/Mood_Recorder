import { INSTRUMENTS, INSTRUMENT_LIST, type InstrumentType } from '../services/instruments'
import './InstrumentSelector.css'

interface InstrumentSelectorProps {
  currentInstrument: InstrumentType
  onInstrumentChange: (instrument: InstrumentType) => void
  disabled?: boolean
}

export default function InstrumentSelector({
  currentInstrument,
  onInstrumentChange,
  disabled = false
}: InstrumentSelectorProps) {
  return (
    <div className="instrument-selector">
      <h3 className="instrument-title">악기 선택</h3>
      <div className="instrument-grid">
        {INSTRUMENT_LIST.map((instrumentId) => {
          const instrument = INSTRUMENTS[instrumentId]
          const isSelected = currentInstrument === instrumentId

          return (
            <button
              key={instrumentId}
              className={`instrument-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onInstrumentChange(instrumentId)}
              disabled={disabled}
              title={instrument.name}
            >
              <span className="instrument-icon">{instrument.icon}</span>
              <span className="instrument-name">{instrument.koreanName}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
