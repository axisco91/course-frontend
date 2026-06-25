import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialStudentFinalized from 'src/views/potential-students/public/PublicPotentialStudentFinalized'

const PotentialStudentPublicFinalizedPage = () => {
  return <PublicPotentialStudentFinalized />
}

export default PotentialStudentPublicFinalizedPage

PotentialStudentPublicFinalizedPage.authGuard = false
PotentialStudentPublicFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
