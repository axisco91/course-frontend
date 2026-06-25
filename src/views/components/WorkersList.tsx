// ** React Imports
import React, { Fragment, useEffect, useState } from 'react'

// ** MUI Imports
import {
  Avatar,
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** Utils Import
import SearchBar from 'src/views/components/SearchBar'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'
import { workerActions } from 'src/reducers/general/WorkerReducer'
import { useDispatch } from 'react-redux'
import ContractedWorkerList from 'src/views/lists/ContractedWorkerList'

const WorkersList = () => {
  // Traducciones
  const { t } = useTranslation()

  // Hook
  const theme = useTheme()
  const dispatch = useDispatch()
  const workers = useSelector((state: RootState) => state.worker.contractedWorkers)

  // States
  const [searchValue, setSearchValue] = useState('')
  const [filteredWorkers, setFilteredWorkers] = useState(workers)

  // Método que busca el template con id y el contador y elimina de la lista
  const handleDelete = (contractId: number) => {
    dispatch(workerActions.deleteContractedWorkers({ contract_id: contractId }))
  }

  // Método que limpia los trabajadores
  const handleClear = () => {
    dispatch(workerActions.setContractedWorkers([]))
    setFilteredWorkers([])
  }

  useEffect(() => {
    setFilteredWorkers(workers.filter(worker => worker?.full_name?.toLowerCase().includes(searchValue?.toLowerCase())))
  }, [searchValue, workers])

  return (
    <DatePickerWrapper>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={12}>
          <Box sx={{ mb: 5 }}>
            <ContractedWorkerList />
          </Box>
          <SearchBar
            value={searchValue}
            clearSearch={() => setSearchValue('')}
            onChange={event => setSearchValue(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={12}>
          <Button variant='contained' sx={{ mr: 4 }} type='submit' onClick={() => handleClear()}>
            <Icon icon='tabler:broom' fontSize={20} />
            {t('Clear')}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <List
            dense
            sx={{
              mb: 3,
              maxHeight: '350px',
              overflowY: 'auto',
              '& .MuiListItemText-primary': {
                ...theme.typography.body1,
                fontWeight: 500,
                color: 'text.secondary'
              },
              '& .MuiListItemText-secondary': {
                ...theme.typography.body1,
                fontWeight: 500,
                color: 'text.disabled'
              }
            }}
          >
            {filteredWorkers.map(worker => {
              return (
                <ListItem key={worker.contract_id} sx={{ px: 0, py: 2, display: 'flex', flexWrap: 'wrap' }}>
                  <ListItemAvatar>
                    <Avatar src={worker.profile_photo_path} alt={worker.full_name} sx={{ height: 28, width: 28 }} />
                  </ListItemAvatar>
                  <ListItemText
                    sx={{ m: 0 }}
                    primary={worker.full_name}
                    secondary={`${!worker.name ? '' : worker.contract_name} ${worker.contract_start}`}
                  />
                  <ListItemSecondaryAction sx={{ right: 0 }}>
                    <Fragment>
                      <Button
                        color='secondary'
                        aria-haspopup='true'
                        sx={{ textTransform: 'capitalize' }}
                        aria-controls='modal-share-examples'
                        endIcon={<Icon icon='tabler:minus' fontSize={20} />}
                        onClick={() => handleDelete(worker.contract_id)}
                      >
                        <Icon icon='tabler:trash' fontSize={20} />
                        {t('Delete')}
                      </Button>
                    </Fragment>
                  </ListItemSecondaryAction>
                </ListItem>
              )
            })}
          </List>
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

export default WorkersList
