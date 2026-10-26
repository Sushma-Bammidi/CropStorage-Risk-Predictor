import React from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const RISK_COLORS = {
  Low:    '#22c55e',
  Medium: '#eab308',
  High:   '#ef4444',
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="t-label">{payload[0].name}</p>
        {payload.map((p, i) => (
          <div key={i} className="t-item">
            <span className="t-dot" style={{ background: p.fill || p.color }} />
            {p.value} predictions
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function RiskChart({ history }) {
  if (!history.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <p>Charts will appear after your first prediction.</p>
      </div>
    )
  }

  // Count risks
  const counts = history.reduce(
    (acc, item) => {
      acc[item.risk_level] = (acc[item.risk_level] || 0) + 1
      return acc
    },
    {}
  )

  const pieData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  // Bar chart: last 15 predictions average high probability
  const barData = history.slice(-15).map((item, i) => ({
    name: `#${i + 1}`,
    Low:    Math.round((item.probabilities?.Low || 0) * 100),
    Medium: Math.round((item.probabilities?.Medium || 0) * 100),
    High:   Math.round((item.probabilities?.High || 0) * 100),
    crop: item.crop_type,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Pie chart */}
      <div>
        <p className="card-subtitle" style={{ marginBottom: 12 }}>Risk Distribution</p>
        <div className="chart-container" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(val) => (
                  <span style={{ color: RISK_COLORS[val], fontSize: 12 }}>{val}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div>
        <p className="card-subtitle" style={{ marginBottom: 12 }}>Probability Breakdown (last 15)</p>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="custom-tooltip">
                      <p className="t-label">Prediction {label}</p>
                      {payload.map((p) => (
                        <div key={p.name} className="t-item">
                          <span className="t-dot" style={{ background: p.fill }} />
                          {p.name}: {p.value}%
                        </div>
                      ))}
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="Low"    stackId="a" fill={RISK_COLORS.Low}    radius={[0,0,0,0]} />
              <Bar dataKey="Medium" stackId="a" fill={RISK_COLORS.Medium} />
              <Bar dataKey="High"   stackId="a" fill={RISK_COLORS.High}   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
