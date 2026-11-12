import { Download } from 'lucide-react'

export default function LabResults({ results }) {
  return (
    <section className="card lab" aria-labelledby="lab-title">
      <h2 id="lab-title" className="card__title">
        Lab Results
      </h2>
      {results.length === 0 ? (
        <p className="empty-note">No lab results available.</p>
      ) : (
        <ul className="lab__list">
          {results.map((name, i) => (
            <li className="lab__item" key={`${name}-${i}`}>
              <span>{name}</span>
              <button type="button" className="icon-button" aria-label={`Download ${name}`}>
                <Download size={18} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
