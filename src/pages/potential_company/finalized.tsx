import BlankLayout from 'src/@core/layouts/BlankLayout'
import PublicPotentialCompanyFinalized from 'src/views/potential-companies/public/PublicPotentialCompanyFinalized'

const PotentialCompanyPublicLegacyFinalizedPage = () => {
  return <PublicPotentialCompanyFinalized />
}

export default PotentialCompanyPublicLegacyFinalizedPage

PotentialCompanyPublicLegacyFinalizedPage.authGuard = false
PotentialCompanyPublicLegacyFinalizedPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
