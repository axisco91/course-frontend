import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialStudentFinalized from 'src/views/potential-students/public/PublicPotentialStudentFinalized'

const PotentialStudentPublicLegacyFinalizedPage = () => {
  return <PublicPotentialStudentFinalized />
}

export default PotentialStudentPublicLegacyFinalizedPage

PotentialStudentPublicLegacyFinalizedPage.authGuard = false
PotentialStudentPublicLegacyFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
