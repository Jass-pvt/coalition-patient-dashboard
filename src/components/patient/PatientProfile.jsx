import PatientInfo from './PatientInfo'
import PatientDetails from './PatientDetails'

export default function PatientProfile({ patient }) {
  return (
    <section className="card profile" aria-label="Patient profile">
      <PatientInfo name={patient.name} photo={patient.photo} />
      <PatientDetails patient={patient} />
      <button type="button" className="button button--primary">
        Show All Information
      </button>
    </section>
  )
}
