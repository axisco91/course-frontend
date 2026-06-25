// ** Next Import
import { Box } from '@mui/material'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'

// ** Demo Components Imports
import AccountSettings from 'src/views/account-settings/AccountSettings'

const AccountSettingsTab = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { tab } = router.query // Get the id and tab dynamically

  if (!tab) return <Box>{t('Loading') + '...'}</Box> // Avoid rendering before router is ready

  return <AccountSettings tab={tab as string} />
}

export default AccountSettingsTab
