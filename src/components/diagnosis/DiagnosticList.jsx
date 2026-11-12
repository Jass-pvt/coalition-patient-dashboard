export default function DiagnosticList({ items }) {
  return (
    <section className="card diagnostics" aria-labelledby="diagnostics-title">
      <h2 id="diagnostics-title" className="card__title">
        Diagnostic List
      </h2>
      {items.length === 0 ? (
        <p className="empty-note">No diagnostics recorded.</p>
      ) : (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-labelledby="diagnostics-title"
        >
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Problem/Diagnosis</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const statusSlug = (item.status || '')
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                return (
                  <tr key={item.id}>
                    <td>{item.name ?? '—'}</td>
                    <td>{item.description ?? '—'}</td>
                    <td>
                      {item.status ? (
                        <span className={`status-badge status-badge--${statusSlug}`}>
                          {item.status}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
