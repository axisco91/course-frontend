import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialPrivateStudentForm from 'src/views/potential-students/public/PublicPotentialPrivateStudentForm'

const PotentialPrivateStudentPublicLegacyPage = () => {
  return <PublicPotentialPrivateStudentForm />
}

export default PotentialPrivateStudentPublicLegacyPage

PotentialPrivateStudentPublicLegacyPage.authGuard = false
PotentialPrivateStudentPublicLegacyPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
