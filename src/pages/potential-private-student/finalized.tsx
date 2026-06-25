import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialPrivateStudentFinalized from 'src/views/potential-students/public/PublicPotentialPrivateStudentFinalized'

const PotentialPrivateStudentPublicFinalizedPage = () => {
  return <PublicPotentialPrivateStudentFinalized />
}

export default PotentialPrivateStudentPublicFinalizedPage

PotentialPrivateStudentPublicFinalizedPage.authGuard = false
PotentialPrivateStudentPublicFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
