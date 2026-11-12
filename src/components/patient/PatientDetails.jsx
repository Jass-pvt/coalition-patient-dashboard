import { Calendar, Venus, Mars, Phone, ShieldCheck } from 'lucide-react'
import { formatDate } from '../../utils/dateFormatter'

const NOT_PROVIDED = 'Not provided'

export default function PatientDetails({ patient }) {
  const GenderIcon = patient.gender?.toLowerCase() === 'male' ? Mars : Venus
  const rows = [
    { label: 'Date Of Birth', value: formatDate(patient.dateOfBirth), icon: Calendar, tone: 'birth' },
    { label: 'Gender', value: patient.gender, icon: GenderIcon, tone: 'gender' },
    { label: 'Contact Info.', value: patient.phone, icon: Phone, tone: 'phone' },
    { label: 'Emergency Contacts', value: patient.emergencyContact, icon: Phone, tone: 'emergency' },
    { label: 'Insurance Provider', value: patient.insurance, icon: ShieldCheck, tone: 'insurance' },
  ]
  return (
    <dl className="details">
      {rows.map(({ label, value, icon: Icon, tone }) => (
        <div className="details__row" key={label}>
          <span className={`details__icon details__icon--${tone}`} aria-hidden="true">
            <Icon size={20} />
          </span>
          <div>
            <dt className="details__label">{label}</dt>
            <dd className="details__value">{value ?? NOT_PROVIDED}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
