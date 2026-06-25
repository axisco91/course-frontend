// ** React Imports
import React, { Fragment, ReactElement, Ref, forwardRef, useEffect, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import {
  Avatar,
  Dialog,
  DialogContent,
  Fade,
  FadeProps,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useDispatch } from 'react-redux'
import { workerActions } from 'src/reducers/general/WorkerReducer'
import SearchBar from './SearchBar'
import { useTheme } from '@mui/material/styles'

// Para los dialogs
const Transition = forwardRef(function Transition(
  props: FadeProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} />
})

const CustomCloseButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}))

interface IncidenceDialogProps {
  onClose: () => void
}

const WorkersListDialog: React.FC<IncidenceDialogProps> = ({ onClose }) => {
  // Para el idioma
  const { t } = useTranslation()
  const theme = useTheme()
  const workers = useSelector((state: RootState) => state.worker.workersList)
  const dispatch = useDispatch()

  // States
  const [searchValue, setSearchValue] = useState('')
  const [filteredWorkers, setFilteredWorkers] = useState(workers)

  const handleCloseDialog = () => {
    dispatch(workerActions.setWorkersList([]))
    onClose()
  }

  useEffect(() => {
    setFilteredWorkers(workers.filter(worker => worker?.full_name?.toLowerCase().includes(searchValue?.toLowerCase())))
  }, [searchValue, workers])

  return (
    <Fragment>
      <Dialog
        fullWidth
        open={true}
        maxWidth='md'
        scroll='body'
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        onBackdropClick={handleCloseDialog}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <CustomCloseButton onClick={handleCloseDialog}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
          </CustomCloseButton>
          <Box>
            <Typography variant='h3'>{t('Workers')}</Typography>
          </Box>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={12}>
              <SearchBar
                value={searchValue}
                clearSearch={() => setSearchValue('')}
                onChange={event => setSearchValue(event.target.value)}
              />
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
                    <ListItem key={worker.id} sx={{ px: 0, py: 2, display: 'flex', flexWrap: 'wrap' }}>
                      <ListItemAvatar>
                        <Avatar src={worker.profile_photo_path} alt={worker.full_name} sx={{ height: 28, width: 28 }} />
                      </ListItemAvatar>
                      <ListItemText sx={{ m: 0 }} primary={worker.full_name} />
                    </ListItem>
                  )
                })}
              </List>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Fragment>
  )
}

export default WorkersListDialog
