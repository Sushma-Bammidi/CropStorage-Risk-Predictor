import React from 'react'
import { RISK_CONFIG } from './RiskBadge'

const PROB_CLASSES = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
}

export default function PredictionResult({ result }) {
  if (!result) return null

  const { risk_level, probabilities, recommendation, crop_type, temperature, humidity, storage_days } = result
  const cfg = RISK_CONFIG[risk_level] || RISK_CONFIG.Low
  const cls = cfg.cls

  return (
    <div className={`result-card ${cls}`}>
      <div className={`result-icon-wrap ${cls}`}>
        {cfg.emoji}
      </div>
      <div className="result-body">
        <p className="result-label">Spoilage Risk Level</p>
        <p className={`result-risk ${cls}`}>{risk_level} Risk</p>

        {/* Input summary chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {[
            { icon: '🌾', val: crop_type },
            { icon: '🌡️', val: `${temperature}°C` },
            { icon: '💧', val: `${humidity}%` },
            { icon: '📅', val: `${storage_days} days` },
          ].map((chip) => (
            <span
              key={chip.val}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              {chip.icon} {chip.val}
            </span>
          ))}
        </div>

        {/* Probability bars */}
        {probabilities && (
          <div className="prob-bars">
            {Object.entries(probabilities).map(([label, prob]) => (
              <div key={label} className="prob-row">
                <span className="prob-label">{label}</span>
                <div className="prob-track">
                  <div
                    className={`prob-fill ${PROB_CLASSES[label] || 'low'}`}
                    style={{ width: `${(prob * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="prob-pct">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        <div className={`result-rec ${cls}`}>{recommendation}</div>
      </div>
    </div>
  )
}
