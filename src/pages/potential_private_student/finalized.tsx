import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialPrivateStudentFinalized from 'src/views/potential-students/public/PublicPotentialPrivateStudentFinalized'

const PotentialPrivateStudentPublicLegacyFinalizedPage = () => {
  return <PublicPotentialPrivateStudentFinalized />
}

export default PotentialPrivateStudentPublicLegacyFinalizedPage

PotentialPrivateStudentPublicLegacyFinalizedPage.authGuard = false
PotentialPrivateStudentPublicLegacyFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
