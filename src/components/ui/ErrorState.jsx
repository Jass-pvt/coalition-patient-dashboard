export default function ErrorState({ title = 'Unable to load patient data', message, onRetry }) {
  return (
    <div className="card state" role="alert">
      <h2 className="card__title">{title}</h2>
      <p>{message}</p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
