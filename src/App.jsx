import { useState } from 'react'
import DashboardLayout from './components/layout/DashboardLayout'
import PatientSidebar from './components/layout/PatientSidebar'
import PatientProfile from './components/patient/PatientProfile'
import LabResults from './components/patient/LabResults'
import DiagnosisHistory from './components/diagnosis/DiagnosisHistory'
import DiagnosticList from './components/diagnosis/DiagnosticList'
import Overview from './components/sections/Overview'
import SectionPlaceholder from './components/sections/SectionPlaceholder'
import LoadingState from './components/ui/LoadingState'
import ErrorState from './components/ui/ErrorState'
import { DEFAULT_SECTION, PLACEHOLDER_SECTIONS, getNavItem } from './components/layout/navigation'
import { usePatientData } from './hooks/usePatientData'

export default function App() {
  // The data hook lives here (above the section switch) so navigating between sections
  // never re-mounts it and never triggers another patient API request.
  const { status, patient, patients, selectPatient, error, retry } = usePatientData()
  const [activeSection, setActiveSection] = useState(DEFAULT_SECTION)

  let content
  if (PLACEHOLDER_SECTIONS.includes(activeSection)) {
    const { label, icon } = getNavItem(activeSection)
    content = (
      <SectionPlaceholder
        label={label}
        icon={icon}
        onBackToPatients={() => setActiveSection(DEFAULT_SECTION)}
      />
    )
  } else if (status === 'loading') {
    content = <LoadingState />
  } else if (status === 'error') {
    content = <ErrorState message={error} onRetry={retry} />
  } else if (status === 'empty') {
    content = (
      <ErrorState
        title="No patient data"
        message="No patient record is available from the API response."
        onRetry={retry}
      />
    )
  } else if (activeSection === 'overview') {
    content = <Overview patient={patient} patients={patients} />
  } else {
    content = (
      <>
        <PatientSidebar patient={patient} patients={patients} onSelectPatient={selectPatient} />
        <main className="dashboard__main" aria-label="Diagnosis overview">
          <DiagnosisHistory history={patient.history} />
          <DiagnosticList items={patient.diagnostics} />
        </main>
        <div className="dashboard__aside">
          <PatientProfile patient={patient} />
          <LabResults results={patient.labResults} />
        </div>
      </>
    )
  }

  return (
    <DashboardLayout activeSection={activeSection} onNavigate={setActiveSection}>
      {content}
    </DashboardLayout>
  )
}
