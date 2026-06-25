import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialPrivateStudentForm from 'src/views/potential-students/public/PublicPotentialPrivateStudentForm'

const PotentialPrivateStudentPublicPage = () => {
  return <PublicPotentialPrivateStudentForm />
}

export default PotentialPrivateStudentPublicPage

PotentialPrivateStudentPublicPage.authGuard = false
PotentialPrivateStudentPublicPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
