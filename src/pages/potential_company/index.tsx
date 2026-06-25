import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialCompanyForm from 'src/views/potential-companies/public/PublicPotentialCompanyForm'

const PotentialCompanyPublicLegacyPage = () => {
  return <PublicPotentialCompanyForm />
}

export default PotentialCompanyPublicLegacyPage

PotentialCompanyPublicLegacyPage.authGuard = false
PotentialCompanyPublicLegacyPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
