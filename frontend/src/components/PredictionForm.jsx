import React, { useState } from 'react'
import axios from 'axios'

const CROPS = ['Wheat', 'Maize', 'Rice', 'Barley', 'Sorghum', 'Potato', 'Onion']

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function PredictionForm({ onResult }) {
  const [form, setForm] = useState({
    crop_type: 'Wheat',
    temperature: 22,
    humidity: 65,
    storage_days: 30,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        temperature: parseFloat(form.temperature),
        humidity: parseFloat(form.humidity),
        storage_days: parseInt(form.storage_days, 10),
      }
      const { data } = await axios.post(`${API_BASE}/predict`, payload)
      onResult({ ...data, timestamp: new Date().toISOString() })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to connect to API. Is the backend running?'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Crop Type */}
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">🌾</span> Crop Type
          </label>
          <select
            id="crop_type"
            className="form-select"
            value={form.crop_type}
            onChange={(e) => handleChange('crop_type', e.target.value)}
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Storage Days */}
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">📅</span> Storage Duration (days)
          </label>
          <div className="slider-container">
            <div className="slider-row">
              <input
                id="storage_days_slider"
                type="range"
                className="slider"
                min={1}
                max={365}
                value={form.storage_days}
                onChange={(e) => handleChange('storage_days', e.target.value)}
              />
              <span className="slider-value">{form.storage_days}d</span>
            </div>
            <div className="slider-labels"><span>1 day</span><span>365 days</span></div>
          </div>
        </div>

        {/* Temperature */}
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">🌡️</span> Temperature (°C)
          </label>
          <div className="slider-container">
            <div className="slider-row">
              <input
                id="temperature_slider"
                type="range"
                className="slider"
                min={0}
                max={50}
                step={0.5}
                value={form.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
              />
              <span className="slider-value">{form.temperature}°C</span>
            </div>
            <div className="slider-labels"><span>0°C</span><span>50°C</span></div>
          </div>
        </div>

        {/* Humidity */}
        <div className="form-group">
          <label className="form-label">
            <span className="label-icon">💧</span> Humidity (%)
          </label>
          <div className="slider-container">
            <div className="slider-row">
              <input
                id="humidity_slider"
                type="range"
                className="slider"
                min={20}
                max={100}
                value={form.humidity}
                onChange={(e) => handleChange('humidity', e.target.value)}
              />
              <span className="slider-value">{form.humidity}%</span>
            </div>
            <div className="slider-labels"><span>20%</span><span>100%</span></div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <button
        id="predict_btn"
        type="submit"
        className="btn-predict"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analyzing…
          </>
        ) : (
          <>🔬 Predict Spoilage Risk</>
        )}
      </button>
    </form>
  )
}
