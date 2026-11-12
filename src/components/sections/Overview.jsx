import { Fragment } from 'react'
import { buildOverviewSummary } from '../../utils/overviewSummary'

function Stat({ label, value, note }) {
  return (
    <div className="overview__stat">
      <dt className="overview__label">{label}</dt>
      <dd className="overview__value">{value}</dd>
      {note ? <dd className="overview__note">{note}</dd> : null}
    </div>
  )
}

export default function Overview({ patient, patients = [] }) {
  const summary = buildOverviewSummary(patient, patients.length)
  if (!summary) return null

  const statusNote = summary.diagnosticStatuses.length ? (
    <>
      {summary.diagnosticStatuses.map(({ label, count }, index) => (
        <Fragment key={label}>
          {index > 0 ? ' · ' : null}
          <span className="overview__nowrap">
            {count} {label}
          </span>
        </Fragment>
      ))}
    </>
  ) : null

  return (
    <main className="card overview" aria-labelledby="overview-title">
      <h2 id="overview-title" className="card__title">
        Overview
      </h2>
      <p className="overview__intro">
        Summary for {summary.name ?? 'the selected patient'}
        {summary.demographics ? ` (${summary.demographics})` : ''}, based on the patient data
        already loaded
        {summary.latestReadingLabel ? `. Latest reading: ${summary.latestReadingLabel}.` : '.'}
      </p>
      <dl className="overview__grid">
        <Stat
          label="Blood pressure"
          value={summary.bloodPressure}
          note={summary.bloodPressureLevels}
        />
        <Stat label="Heart rate" value={summary.heartRate} />
        <Stat label="Respiratory rate" value={summary.respiratoryRate} />
        <Stat label="Temperature" value={summary.temperature} />
        <Stat label="Diagnostic records" value={summary.diagnosticCount} note={statusNote} />
        <Stat label="Lab results" value={summary.labResultCount} />
        <Stat label="Recorded readings" value={summary.readingsCount} />
        <Stat label="Patients in directory" value={summary.directoryCount} />
      </dl>
    </main>
  )
}
