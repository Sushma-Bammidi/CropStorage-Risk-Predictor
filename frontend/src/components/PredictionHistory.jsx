import React from 'react'
import RiskBadge from './RiskBadge'

export default function PredictionHistory({ history, onClear }) {
  if (!history.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>No predictions yet. Use the form above to make your first prediction.</p>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={onClear}
          id="clear_history_btn"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            color: '#ef4444',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🗑 Clear History
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Time</th>
              <th>Crop</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>Days</th>
              <th>Risk</th>
              <th>High %</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((item, i) => {
              const time = new Date(item.timestamp)
              const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <tr key={i}>
                  <td>{history.length - i}</td>
                  <td>{timeStr}</td>
                  <td>{item.crop_type}</td>
                  <td>{item.temperature}</td>
                  <td>{item.humidity}</td>
                  <td>{item.storage_days}</td>
                  <td><RiskBadge risk={item.risk_level} /></td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>
                    {item.probabilities?.High
                      ? `${(item.probabilities.High * 100).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
