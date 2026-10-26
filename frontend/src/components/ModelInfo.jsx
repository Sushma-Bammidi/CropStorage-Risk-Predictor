import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const FEATURE_LABELS = {
  crop_encoded:  'Crop Type',
  humidity:      'Humidity',
  storage_days:  'Storage Days',
  temperature:   'Temperature',
}

export default function ModelInfo() {
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios.get(`${API_BASE}/model-info`)
      .then((r) => setMeta(r.data))
      .catch(() => setError('Could not load model info'))
  }, [])

  if (error) return <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>
  if (!meta) return <p style={{ color: '#475569', fontSize: 13 }}>Loading model info…</p>

  const fi = meta.feature_importances || {}
  const maxFI = Math.max(...Object.values(fi))

  return (
    <div>
      {/* Accuracy chips */}
      <div className="info-chips">
        <div className="info-chip">
          🎯 Test Accuracy: <strong style={{ color: '#22c55e', marginLeft: 4 }}>
            {(meta.accuracy * 100).toFixed(2)}%
          </strong>
        </div>
        <div className="info-chip">
          📊 CV Mean: <strong style={{ color: '#3b82f6', marginLeft: 4 }}>
            {(meta.cv_mean * 100).toFixed(2)}%
          </strong>
        </div>
        <div className="info-chip">
          ±<strong style={{ color: '#8b5cf6', marginLeft: 4 }}>
            {(meta.cv_std * 100).toFixed(2)}%
          </strong> std
        </div>
        <div className="info-chip">
          🌲 Random Forest · 200 trees
        </div>
        <div className="info-chip">
          📁 Classes: {(meta.classes || []).join(' / ')}
        </div>
      </div>

      {/* Feature importances */}
      <p style={{ color: '#475569', fontSize: 12, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Feature Importances
      </p>
      {Object.entries(fi)
        .sort((a, b) => b[1] - a[1])
        .map(([key, val]) => (
          <div key={key} className="fi-row">
            <span className="fi-label">{FEATURE_LABELS[key] || key}</span>
            <div className="fi-track">
              <div
                className="fi-fill"
                style={{ width: `${(val / maxFI) * 100}%` }}
              />
            </div>
            <span className="fi-pct">{(val * 100).toFixed(1)}%</span>
          </div>
        ))}

      {/* Classification report summary */}
      {meta.classification_report && (
        <>
          <p style={{ color: '#475569', fontSize: 12, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Per-Class Metrics
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Class</th><th>Precision</th><th>Recall</th><th>F1-Score</th><th>Support</th>
                </tr>
              </thead>
              <tbody>
                {['Low', 'Medium', 'High'].map((cls) => {
                  const r = meta.classification_report[cls]
                  if (!r) return null
                  return (
                    <tr key={cls}>
                      <td>{cls}</td>
                      <td>{r.precision?.toFixed(3)}</td>
                      <td>{r.recall?.toFixed(3)}</td>
                      <td>{r['f1-score']?.toFixed(3)}</td>
                      <td>{r.support}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
