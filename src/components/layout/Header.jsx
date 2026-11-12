import { useRef } from 'react'
import { Settings, MoreVertical } from 'lucide-react'
import { NAV_ITEMS, DEFAULT_SECTION } from './navigation'

function Logo({ onHome }) {
  // Plain clicks stay in the SPA (a full reload would repeat the patient API request);
  // modified clicks (new tab/window) keep the normal link behaviour.
  const handleClick = (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return
    event.preventDefault()
    onHome?.()
  }
  return (
    <a className="logo" href="/" aria-label="Tech.Care home" onClick={handleClick}>
      <svg width="38" height="42" viewBox="0 0 38 42" aria-hidden="true">
        <path d="M19 0l9 9-9 9-9-9z" fill="#01F0D0" />
        <path d="M0 18l9-9v18z" fill="#1A8F8A" />
        <path d="M19 18l9 9-9 15-9-15z" fill="#072635" />
        <path d="M28 9l10 9-10 9z" fill="#0DB8D6" />
      </svg>
      <span className="logo__text">
        Tech<span className="logo__dot">.</span>Care
      </span>
    </a>
  )
}

export default function Header({ activeSection = DEFAULT_SECTION, onNavigate }) {
  const itemRefs = useRef([])

  // Tab/Shift+Tab and Enter/Space work natively on <button>. Arrow keys, Home and End
  // additionally move focus along the bar (focus only; activation stays on Enter/Space).
  const handleKeyDown = (event, index) => {
    const last = NAV_ITEMS.length - 1
    let next = null
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next === null) return
    event.preventDefault()
    itemRefs.current[next]?.focus()
  }

  return (
    <header className="header">
      <Logo onHome={() => onNavigate?.(DEFAULT_SECTION)} />
      <nav className="header__nav" aria-label="Primary">
        <ul>
          {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => {
            const isActive = id === activeSection
            return (
              <li key={id}>
                <button
                  type="button"
                  ref={(node) => {
                    itemRefs.current[index] = node
                  }}
                  className={`nav-item${isActive ? ' nav-item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onNavigate?.(id)}
                  // On narrow screens the nav scrolls sideways; make sure a focused item is fully visible.
                  onFocus={(event) =>
                    event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
                  }
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="header__user">
        <span className="avatar" aria-hidden="true">
          JS
        </span>
        <div className="header__user-text">
          <p className="header__user-name">Dr. Jose Simmons</p>
          <p className="header__user-role">General Practitioner</p>
        </div>
        <div className="header__divider" aria-hidden="true" />
        <button type="button" className="icon-button" aria-label="Settings">
          <Settings size={18} aria-hidden="true" />
        </button>
        <button type="button" className="icon-button" aria-label="More options">
          <MoreVertical size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
