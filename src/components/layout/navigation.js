import { Home, Users, Calendar, MessageSquare, CreditCard } from 'lucide-react'

/** Single source of truth for the primary navigation (labels match the XD design). */
export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'message', label: 'Message', icon: MessageSquare },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
]

export const DEFAULT_SECTION = 'patients'

/** Sections that are intentionally not built for this assessment. */
export const PLACEHOLDER_SECTIONS = ['schedule', 'message', 'transactions']

export const getNavItem = (id) => NAV_ITEMS.find((item) => item.id === id) ?? null
