import { ArrowUp, ArrowDown } from 'lucide-react'
import { levelTrend } from '../../utils/patientHelpers'

export default function VitalCard({ title, value, levels, icon: Icon, tone }) {
  const trend = levelTrend(levels)
  return (
    <article className={`vital vital--${tone}`}>
      <span className="vital__icon" aria-hidden="true">
        <Icon size={44} strokeWidth={1.6} />
      </span>
      <h3 className="vital__title">{title}</h3>
      <p className="vital__value">{value}</p>
      <p className="vital__level">
        {trend === 'up' && <ArrowUp size={12} aria-hidden="true" />}
        {trend === 'down' && <ArrowDown size={12} aria-hidden="true" />}
        {levels ?? 'No level reported'}
      </p>
    </article>
  )
}
