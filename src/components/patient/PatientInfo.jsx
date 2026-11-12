import { useState } from 'react'

export default function PatientInfo({ name, photo }) {
  const [imgError, setImgError] = useState(false)
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <div className="profile__identity">
      {photo && !imgError ? (
        <img
          className="profile__photo"
          src={photo}
          alt={name ? `Portrait of ${name}` : 'Patient portrait'}
          width="200"
          height="200"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="profile__photo profile__photo--placeholder"
          aria-label={name ? `Portrait placeholder for ${name}` : 'No photo available'}
        >
          {initials}
        </div>
      )}
      <h2 className="profile__name">{name ?? 'Unknown patient'}</h2>
    </div>
  )
}
