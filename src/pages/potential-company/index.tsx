import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialCompanyForm from 'src/views/potential-companies/public/PublicPotentialCompanyForm'

const PotentialCompanyPublicPage = () => {
  return <PublicPotentialCompanyForm />
}

export default PotentialCompanyPublicPage

PotentialCompanyPublicPage.authGuard = false
PotentialCompanyPublicPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
