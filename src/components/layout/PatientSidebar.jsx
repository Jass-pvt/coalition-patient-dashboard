import { useState, useMemo } from 'react'
import { Search, MoreHorizontal, X } from 'lucide-react'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PatientSidebar({ patient, patients = [], onSelectPatient }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const list = useMemo(() => {
    if (patients && patients.length > 0) return patients
    if (patient) {
      return [
        {
          id: patient.id || (patient.name ? patient.name.toLowerCase() : 'patient-0'),
          name: patient.name,
          gender: patient.gender,
          age: patient.age,
          photo: patient.photo,
        },
      ]
    }
    return []
  }, [patients, patient])

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter((p) => p.name?.toLowerCase().includes(q))
  }, [list, searchQuery])

  const selectedName = patient?.name?.toLowerCase()

  return (
    <aside className="card patients" aria-labelledby="patients-title">
      <div className="card__header">
        <h2 id="patients-title" className="card__title">
          Patients
        </h2>
        <button
          type="button"
          className="icon-button"
          aria-label={searchOpen ? 'Close search' : 'Search patients'}
          onClick={() => {
            setSearchOpen((prev) => !prev)
            if (searchOpen) setSearchQuery('')
          }}
        >
          {searchOpen ? (
            <X size={18} aria-hidden="true" />
          ) : (
            <Search size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      {searchOpen && (
        <div className="patients__search-bar">
          <input
            type="search"
            className="patients__search-input"
            placeholder="Search patients by name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            aria-label="Filter patients list"
          />
        </div>
      )}

      <ul className="patients__list" role="list">
        {filteredList.length === 0 ? (
          <li className="patients__empty-search">No patients match your search.</li>
        ) : (
          filteredList.map((item) => {
            const isSelected = item.name?.toLowerCase() === selectedName
            const meta = [
              item.gender,
              item.age !== null && item.age !== undefined ? item.age : null,
            ]
              .filter((v) => v !== null)
              .join(', ')

            return (
              <li
                key={item.id || item.name}
                className={`patients__item${isSelected ? ' patients__item--selected' : ''}`}
              >
                <button
                  type="button"
                  className="patients__select"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectPatient && onSelectPatient(item.name)}
                >
                  {item.photo ? (
                    <img
                      className="patients__photo"
                      src={item.photo}
                      alt=""
                      width="48"
                      height="48"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling
                        if (fallback) fallback.style.display = 'grid'
                      }}
                    />
                  ) : null}
                  <span
                    className="patients__photo patients__photo--initials"
                    style={{ display: item.photo ? 'none' : 'grid' }}
                    aria-hidden="true"
                  >
                    {getInitials(item.name)}
                  </span>

                  <span className="patients__text">
                    <span className="patients__name">{item.name ?? 'Unknown patient'}</span>
                    {meta && <span className="patients__meta">{meta}</span>}
                  </span>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`More options for ${item.name || 'patient'}`}
                >
                  <MoreHorizontal size={18} aria-hidden="true" />
                </button>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
