import React from 'react'

const RISK_CONFIG = {
  Low:    { emoji: '🌿', label: 'Low Risk',    cls: 'low',    dot: '🟢' },
  Medium: { emoji: '⚠️', label: 'Medium Risk', cls: 'medium', dot: '🟡' },
  High:   { emoji: '🚨', label: 'High Risk',   cls: 'high',   dot: '🔴' },
}

export default function RiskBadge({ risk, size = 'sm' }) {
  if (!risk) return null
  const cfg = RISK_CONFIG[risk] || RISK_CONFIG.Low
  return (
    <span className={`risk-badge ${cfg.cls}`}>
      {cfg.dot} {risk}
    </span>
  )
}

export { RISK_CONFIG }
