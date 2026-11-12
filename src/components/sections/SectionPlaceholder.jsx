export default function SectionPlaceholder({ label, icon: Icon, onBackToPatients }) {
  const titleId = `${label.toLowerCase()}-title`
  return (
    <main className="card section-placeholder" aria-labelledby={titleId}>
      <span className="section-placeholder__icon" aria-hidden="true">
        <Icon size={28} />
      </span>
      <h2 id={titleId} className="card__title">
        {label}
      </h2>
      <p className="section-placeholder__text">
        This section is outside the scope of this assessment.
      </p>
      <p className="section-placeholder__hint">
        The assessment covers the Patients dashboard only, so no {label.toLowerCase()} data is shown
        here.
      </p>
      <button type="button" className="button button--primary" onClick={onBackToPatients}>
        Back to Patients
      </button>
    </main>
  )
}
