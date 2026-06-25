// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Demo Components
import ChangePasswordCard from 'src/views/account-settings/security/ChangePasswordCard'

const TabSecurity = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ChangePasswordCard />
      </Grid>
    </Grid>
  )
}
export default TabSecurity
