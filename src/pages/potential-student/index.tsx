import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialStudentForm from 'src/views/potential-students/public/PublicPotentialStudentForm'

const PotentialStudentPublicPage = () => {
  return <PublicPotentialStudentForm />
}

export default PotentialStudentPublicPage

PotentialStudentPublicPage.authGuard = false
PotentialStudentPublicPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
