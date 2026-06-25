// ** React Imports
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { Button, Card, CardContent, Grid, Typography } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useTranslation } from 'react-i18next'
import { Box } from '@mui/system'
import { useDispatch } from 'react-redux'
import { authActions } from 'src/reducers/users/AuthReducer'

const SelectContract = () => {
  const { t } = useTranslation()
  const contracts = useSelector((state: RootState) => state.auth.contracts)
  const dispatch = useDispatch()

  // Obtenemos todos los contratos
  const contractLists = contracts.map(contract => {
    return (
      <Grid item md={4} sm={6} xs={12} key={contract.id}>
        <Card>
          <CardContent sx={{ textAlign: 'center', '& svg': { mb: 2 } }}>
            <Icon icon='tabler:file-description' fontSize='2rem' />
            <Typography variant='h6' sx={{ mb: 4 }}>
              {contract.name}
            </Typography>
            <Typography sx={{ mb: 3 }}>
              {contract.start} - {contract.end}
            </Typography>
            <Button variant='contained' onClick={() => selectContract(contract.id)}>
              {t('Select')}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    )
  })

  const selectContract = (contractId: number) => {
    if (contractId) {
      dispatch(authActions.setContractId(contractId))
    }
  }

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 0.5 }}>
        {t('Please select the contract that you would like to clock in with')}
      </Typography>
      <Grid container spacing={6} className='match-height'>
        {contractLists}
      </Grid>
    </Box>
  )
}

export default SelectContract
