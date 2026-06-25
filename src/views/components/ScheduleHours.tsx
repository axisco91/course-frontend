// ** React Imports
import { useState, forwardRef, ReactElement, Ref, Fragment } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'

// ** MUI Imports
import Typography from '@mui/material/Typography'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  FadeProps,
  Grid,
  IconButton,
  IconButtonProps
} from '@mui/material'
import { styled } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// **
import { RootState } from 'src/reducers/types/types'
import { toast } from 'react-hot-toast'
import { Box } from '@mui/system'
import { useDispatch } from 'react-redux'
import { destroyCenterScheduleHour, fetchCenterScheduleHour } from 'src/api/api'
import { centerScheduleHourActions } from 'src/reducers/centers/CenterScheduleHourReducer'
import ScheduleHoursList from 'src/views/components/ScheduleHoursList'
import DailyScheduleForm from './DailyScheduleForm'

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

const ScheduleHoursTable = () => {
  // Traducciones
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()

  // ** Selectors
  // Obtenemos el id de la empresa activa
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)

  // Guardamos id y dia del horario para eliminar
  const [id, setId] = useState<number | null>(null)
  const [day, setDay] = useState<number | null>(null)

  // Mostrar o no el dialogo
  const [showDialog, setShowDialog] = useState<boolean>(false)

  // Mostrar o no para editar o crear una nueva franja
  const showForm = useSelector((state: RootState) => state.centerScheduleHour.showForm)

  const scheduleId = useSelector((state: RootState) => state.centerSchedule.id)
  const scheduleMonday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursMonday)
  const scheduleTuesday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursTuesday)
  const scheduleWednesday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursWednesday)
  const scheduleThursday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursThursday)
  const scheduleFriday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursFriday)
  const scheduleSaturday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursSaturday)
  const scheduleSunday = useSelector((state: RootState) => state.centerScheduleHour.scheduleHoursSunday)

  // id usuario
  const { centerId } = router.query

  // Realizamos las acciones de los dialogos
  const handleDelete = () => {
    const data = {
      company_id: activeCompanyId,
      center_id: centerId,
      center_schedule_id: scheduleId
    }

    destroyCenterScheduleHour(id, data)
      .then(response => {
        // Vemos si nos da un success y lo indicamos
        if (response.data.success) {
          toast.success(response.data.message)
          setShowDialog(false)
          setId(null)
          dispatch(centerScheduleHourActions.removeCenterScheduleHour({ id, day }))
        }
      })
      .catch(error => {
        setShowDialog(false)
        setId(null)
        if (error.response) {
          console.error(error.response)
          if (error.response.data.errors) {
            console.error(error.response.data.errors)
          } else {
            console.error('Network Error:', error.response.data.message)
            const errorMessage = error.response.data.message
            toast.error(errorMessage, {
              position: 'top-right'
            })
          }
        } else {
          // Handle network error (e.g., no response from the server)
          console.error('Network Error:', error.message)
          toast.error(error.message, {
            position: 'top-right'
          })
        }
      })
  }

  const handleEdit = async (selectedId: number, selectedDay: number) => {
    dispatch(centerScheduleHourActions.setDay(null))
    dispatch(centerScheduleHourActions.setId(null))
    dispatch(centerScheduleHourActions.setShowForm(false))
    await fetchCenterScheduleHour(selectedId, {
      company_id: activeCompanyId,
      center_id: centerId,
      center_schedule_id: scheduleId
    }).then(res => {
      dispatch(centerScheduleHourActions.setId(selectedId))
      dispatch(centerScheduleHourActions.setCenterScheduleHour(res.data.data.center_schedule_hour))
      dispatch(centerScheduleHourActions.setShowForm(true))
      dispatch(centerScheduleHourActions.setDay(selectedDay))
    })
  }

  const handleCreate = (selectedDay: number) => {
    dispatch(centerScheduleHourActions.setCenterScheduleHour(null))
    dispatch(centerScheduleHourActions.setShowForm(false))
    dispatch(centerScheduleHourActions.setDay(null))
    dispatch(centerScheduleHourActions.setId(null))
    dispatch(centerScheduleHourActions.setDay(selectedDay))
    dispatch(centerScheduleHourActions.setShowForm(true))
  }

  return (
    <Fragment>
      <Grid container spacing={5}>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Monday')}
            </Typography>
            <IconButton onClick={() => handleCreate(1)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleMonday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Tuesday')}
            </Typography>
            <IconButton onClick={() => handleCreate(2)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleTuesday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Wednesday')}
            </Typography>
            <IconButton onClick={() => handleCreate(3)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleWednesday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Thursday')}
            </Typography>
            <IconButton onClick={() => handleCreate(4)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleThursday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Friday')}
            </Typography>
            <IconButton onClick={() => handleCreate(5)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleFriday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Saturday')}
            </Typography>
            <IconButton onClick={() => handleCreate(6)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleSaturday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
        <Grid item xs={12} sm={12 / 7}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ mr: 5 }}>
              {t('Sunday')}
            </Typography>
            <IconButton onClick={() => handleCreate(7)}>
              <Icon icon={'tabler:plus'} fontSize={20} />
            </IconButton>
          </Box>
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            {
              <ScheduleHoursList
                scheduleHours={scheduleSunday}
                onEdit={handleEdit}
                onDelete={(id: number, day: number) => {
                  setId(id)
                  setDay(day)
                  setShowDialog(true)
                }}
              />
            }
          </Grid>
        </Grid>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{ pt: theme => `${theme.spacing(6.5)} !important`, display: 'flex', justifyContent: 'flex-end' }}
      >
        {showForm && (
          <Grid item xs={12} sm={12} sx={{ mt: 2 }}>
            <DailyScheduleForm />
          </Grid>
        )}
      </Grid>
      <Dialog
        fullWidth
        open={showDialog}
        maxWidth='md'
        scroll='body'
        onClose={() => {
          setShowDialog(false)
          setId(null)
        }}
        TransitionComponent={Transition}
        onBackdropClick={() => {
          setShowDialog(false)
          setId(null)
        }}
        sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
      >
        <DialogContent
          sx={{
            pb: theme => `${theme.spacing(8)} !important`,
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pt: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <CustomCloseButton onClick={() => setShowDialog(false)}>
            <Icon icon='tabler:x' fontSize='1.25rem' />
          </CustomCloseButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h3' sx={{ mb: 3 }}>
              {t('Delete')}
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>{t('Are you sure you want to delete it')}</Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: 'center',
            px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
            pb: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
          }}
        >
          <Button variant='contained' sx={{ mr: 1 }} onClick={() => handleDelete()}>
            {t('Yes')}
          </Button>
          <Button
            variant='tonal'
            color='secondary'
            onClick={() => {
              setShowDialog(false)
              setId(null)
            }}
          >
            {t('Cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default ScheduleHoursTable
