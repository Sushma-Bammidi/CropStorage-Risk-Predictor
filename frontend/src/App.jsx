import React, { useState, useEffect } from 'react'
import PredictionForm from './components/PredictionForm'
import PredictionResult from './components/PredictionResult'
import PredictionHistory from './components/PredictionHistory'
import RiskChart from './components/RiskChart'
import ModelInfo from './components/ModelInfo'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const NAV_ITEMS = [
  { id: 'predict', icon: '🔬', label: 'Predict' },
  { id: 'history', icon: '📋', label: 'History' },
  { id: 'charts',  icon: '📊', label: 'Analytics' },
  { id: 'model',   icon: '🧠', label: 'Model Info' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('predict')
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('crop_history') || '[]') } catch { return [] }
  })
  const [latestResult, setLatestResult] = useState(null)
  const [apiOnline, setApiOnline] = useState(null)

  // Persist history
  useEffect(() => {
    localStorage.setItem('crop_history', JSON.stringify(history))
  }, [history])

  // Check API health
  useEffect(() => {
    axios.get(`${API_BASE}/health`)
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false))
  }, [])

  const handleResult = (result) => {
    setLatestResult(result)
    setHistory((prev) => {
      const next = [...prev, result]
      return next.slice(-50) // keep last 50
    })
  }

  const clearHistory = () => {
    setHistory([])
    setLatestResult(null)
  }

  // Stats
  const riskCounts = history.reduce((acc, h) => {
    acc[h.risk_level] = (acc[h.risk_level] || 0) + 1
    return acc
  }, {})

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌾</div>
          <div className="sidebar-logo-text">
            <h1>CropGuard AI</h1>
            <span>Spoilage Predictor</span>
          </div>
        </div>

        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav_${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.id === 'history' && history.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 999,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {history.length}
              </span>
            )}
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="api-status">
            <span className={`status-dot ${apiOnline === false ? 'offline' : ''}`} />
            {apiOnline === null ? 'Connecting…' : apiOnline ? 'API Online' : 'API Offline'}
          </div>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header className="topbar">
        <div className="topbar-title">
          {NAV_ITEMS.find((n) => n.id === activeTab)?.icon}{' '}
          {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
        </div>
        <div className="topbar-stats">
          <div className="stat-chip">
            📦 Total: <strong>{history.length}</strong>
          </div>
          <div className="stat-chip">
            🟢 Low: <strong>{riskCounts.Low || 0}</strong>
          </div>
          <div className="stat-chip">
            🟡 Medium: <strong>{riskCounts.Medium || 0}</strong>
          </div>
          <div className="stat-chip">
            🔴 High: <strong>{riskCounts.High || 0}</strong>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">

        {/* ── PREDICT TAB ── */}
        {activeTab === 'predict' && (
          <>
            {/* Summary row */}
            <div className="summary-grid">
              <div className="summary-box blue">
                <div className="box-icon">📦</div>
                <div className="box-value">{history.length}</div>
                <div className="box-label">Total Predictions</div>
              </div>
              <div className="summary-box green">
                <div className="box-icon">✅</div>
                <div className="box-value">{riskCounts.Low || 0}</div>
                <div className="box-label">Low Risk</div>
              </div>
              <div className="summary-box yellow">
                <div className="box-icon">⚠️</div>
                <div className="box-value">{riskCounts.Medium || 0}</div>
                <div className="box-label">Medium Risk</div>
              </div>
              <div className="summary-box red">
                <div className="box-icon">🚨</div>
                <div className="box-value">{riskCounts.High || 0}</div>
                <div className="box-label">High Risk</div>
              </div>
            </div>

            {/* Form + Result row */}
            <div className="two-col">
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="card-title">🌾 Storage Parameters</p>
                    <p className="card-subtitle">Enter crop and environmental details</p>
                  </div>
                </div>
                <PredictionForm onResult={handleResult} />
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="card-title">📊 Prediction Result</p>
                    <p className="card-subtitle">
                      {latestResult ? 'Latest analysis' : 'Awaiting input…'}
                    </p>
                  </div>
                </div>
                {latestResult ? (
                  <PredictionResult result={latestResult} />
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🔬</div>
                    <p>Submit crop storage parameters to see the spoilage risk prediction.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent quick history */}
            {history.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="card-title">⏱ Recent Predictions</p>
                    <p className="card-subtitle">Last 5 results</p>
                  </div>
                </div>
                <PredictionHistory
                  history={history.slice(-5)}
                  onClear={clearHistory}
                />
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-title">📋 Full Prediction History</p>
                <p className="card-subtitle">{history.length} prediction(s) stored</p>
              </div>
            </div>
            <PredictionHistory history={history} onClear={clearHistory} />
          </div>
        )}

        {/* ── CHARTS TAB ── */}
        {activeTab === 'charts' && (
          <div className="two-col">
            <div className="card">
              <div className="card-header">
                <div>
                  <p className="card-title">📊 Risk Analytics</p>
                  <p className="card-subtitle">Distribution & probability breakdown</p>
                </div>
              </div>
              <RiskChart history={history} />
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <p className="card-title">🌾 Crop Breakdown</p>
                  <p className="card-subtitle">Predictions by crop type</p>
                </div>
              </div>
              <CropBreakdown history={history} />
            </div>
          </div>
        )}

        {/* ── MODEL INFO TAB ── */}
        {activeTab === 'model' && (
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-title">🧠 Model Information</p>
                <p className="card-subtitle">Random Forest · Training metrics · Feature importances</p>
              </div>
            </div>
            <ModelInfo />
          </div>
        )}
      </main>
    </div>
  )
}

// Inline crop breakdown component
function CropBreakdown({ history }) {
  if (!history.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🌾</div>
        <p>No prediction data yet.</p>
      </div>
    )
  }

  const byCrop = history.reduce((acc, h) => {
    if (!acc[h.crop_type]) acc[h.crop_type] = { Low: 0, Medium: 0, High: 0, total: 0 }
    acc[h.crop_type][h.risk_level]++
    acc[h.crop_type].total++
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(byCrop).map(([crop, data]) => (
        <div
          key={crop}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '14px 16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{crop}</span>
            <span style={{ color: '#475569', fontSize: 12 }}>{data.total} predictions</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['Low','#22c55e'], ['Medium','#eab308'], ['High','#ef4444']].map(([r, color]) => (
              data[r] > 0 && (
                <span
                  key={r}
                  style={{
                    background: color + '20',
                    color,
                    border: `1px solid ${color}40`,
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {r}: {data[r]}
                </span>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
