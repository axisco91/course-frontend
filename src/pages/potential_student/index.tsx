import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialStudentForm from 'src/views/potential-students/public/PublicPotentialStudentForm'

const PotentialStudentPublicLegacyPage = () => {
  return <PublicPotentialStudentForm />
}

export default PotentialStudentPublicLegacyPage

PotentialStudentPublicLegacyPage.authGuard = false
PotentialStudentPublicLegacyPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
