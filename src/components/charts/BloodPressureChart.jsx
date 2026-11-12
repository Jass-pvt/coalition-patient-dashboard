import { memo, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChevronDown, ArrowUp, ArrowDown } from 'lucide-react'
import { buildChartData, chartOptions, CHART_COLORS } from './chartConfig'
import { lastEntries, latestEntry, levelTrend, formatReading } from '../../utils/patientHelpers'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

function LegendItem({ label, color, reading }) {
  const trend = levelTrend(reading?.levels)
  return (
    <div className="bp__legend-item">
      <p className="bp__legend-label">
        <span className="bp__dot" style={{ backgroundColor: color }} aria-hidden="true" />
        {label}
      </p>
      <p className="bp__legend-value">{formatReading(reading?.value)}</p>
      <p className="bp__legend-level">
        {trend === 'up' && <ArrowUp size={12} aria-hidden="true" />}
        {trend === 'down' && <ArrowDown size={12} aria-hidden="true" />}
        {reading?.levels ?? 'No level reported'}
      </p>
    </div>
  )
}

function BloodPressureChart({ history }) {
  const entries = useMemo(() => lastEntries(history, 6), [history])
  const data = useMemo(() => buildChartData(entries), [entries])
  const latest = latestEntry(history)
  const summary = entries
    .map((e) => `${e.label}: ${e.systolic.value ?? 'n/a'} over ${e.diastolic.value ?? 'n/a'}`)
    .join('; ')

  return (
    <div className="bp">
      <div className="bp__chart">
        <div className="bp__header">
          <h3 className="bp__title">Blood Pressure</h3>
          <span className="bp__range">
            Last 6 months <ChevronDown size={16} aria-hidden="true" />
          </span>
        </div>
        {entries.length === 0 ? (
          <p className="empty-note">No blood pressure readings available.</p>
        ) : (
          <div className="bp__canvas">
            <Line
              data={data}
              options={chartOptions}
              role="img"
              aria-label={`Blood pressure, systolic and diastolic in mmHg, last ${entries.length} readings. ${summary}`}
            />
          </div>
        )}
      </div>
      <div className="bp__legend">
        <LegendItem label="Systolic" color={CHART_COLORS.systolic} reading={latest?.systolic} />
        <hr className="bp__rule" />
        <LegendItem label="Diastolic" color={CHART_COLORS.diastolic} reading={latest?.diastolic} />
      </div>
    </div>
  )
}

export default memo(BloodPressureChart)
