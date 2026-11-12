import Header from './Header'
import { DEFAULT_SECTION, getNavItem } from './navigation'

export default function DashboardLayout({ activeSection = DEFAULT_SECTION, onNavigate, children }) {
  return (
    <div className="page">
      <Header activeSection={activeSection} onNavigate={onNavigate} />
      {/* Announces section changes to assistive tech; focus stays on the nav button. */}
      <p className="visually-hidden" role="status" data-testid="section-announcer">
        {getNavItem(activeSection)?.label} section
      </p>
      <div className="dashboard">{children}</div>
    </div>
  )
}
