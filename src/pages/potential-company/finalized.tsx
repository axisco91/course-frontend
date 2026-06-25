import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialCompanyFinalized from 'src/views/potential-companies/public/PublicPotentialCompanyFinalized'

const PotentialCompanyPublicFinalizedPage = () => {
  return <PublicPotentialCompanyFinalized />
}

export default PotentialCompanyPublicFinalizedPage

PotentialCompanyPublicFinalizedPage.authGuard = false
PotentialCompanyPublicFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
