import { Wind, Thermometer, HeartPulse } from 'lucide-react'
import BloodPressureChart from '../charts/BloodPressureChart'
import VitalCard from './VitalCard'
import { latestEntry, formatReading } from '../../utils/patientHelpers'

export default function DiagnosisHistory({ history }) {
  const latest = latestEntry(history)
  const vitals = [
    {
      title: 'Respiratory Rate',
      reading: latest?.respiratoryRate,
      unit: ' bpm',
      icon: Wind,
      tone: 'blue',
    },
    {
      title: 'Temperature',
      reading: latest?.temperature,
      unit: '°F',
      icon: Thermometer,
      tone: 'red',
    },
    {
      title: 'Heart Rate',
      reading: latest?.heartRate,
      unit: ' bpm',
      icon: HeartPulse,
      tone: 'pink',
    },
  ]
  return (
    <section className="card diagnosis" aria-labelledby="diagnosis-title">
      <h2 id="diagnosis-title" className="card__title">
        Diagnosis History
      </h2>
      <BloodPressureChart history={history} />
      <div className="vitals">
        {vitals.map(({ title, reading, unit, icon, tone }) => (
          <VitalCard
            key={title}
            title={title}
            value={formatReading(reading?.value, unit)}
            levels={reading?.levels}
            icon={icon}
            tone={tone}
          />
        ))}
      </div>
    </section>
  )
}
