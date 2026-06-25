import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import { Box, Button, Card, CardContent, Grid } from '@mui/material'
import Icon from 'src/@core/components/icon'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'
import CustomTextField from 'src/@core/components/mui/text-field'

// API
import { createTrainingContractFestival } from 'src/api/api'

// refresh trigger
import { generalActions } from 'src/reducers/general/GeneralReducer'
import FestivalsTable from './FestivalsTable'
import FestivalDelete from './FestivalsDelete'

const FestivalsTab = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null

  const communities = useSelector((s: RootState) => (s as any).community?.communities ?? []) as any[]
  const populations = useSelector((s: RootState) => (s as any).population?.populationsWithFestivals ?? []) as any[]

  const [loading, setLoading] = useState(false)
  const [community, setCommunity] = useState<any | null>(null)
  const [population, setPopulation] = useState<any | null>(null)

  const label = (o: any) => o?.name ?? o?.label ?? ''
  const oid = (o: any) => o?.id ?? o?.value ?? null

  const createFestivals = async (type: 'nacional' | 'community' | 'population', id?: number | null) => {
    if (!trainingContractId) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('training_contract_id', String(trainingContractId))
      formData.append('type', type)
      if (id != null) formData.append('id', String(id))

      await createTrainingContractFestival(formData)

      // ✅ fuerza refresh tabla (mismo patrón que usas)
      dispatch(generalActions.addFilterButtonClickCount())
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={5} alignItems='center'>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={communities}
                value={community}
                onChange={(_, v) => {
                  setCommunity(v)
                  const id = v ? oid(v) : null
                  if (id) createFestivals('community', Number(id))
                }}
                getOptionLabel={label}
                isOptionEqualToValue={(o, v) => oid(o) === oid(v)}
                renderInput={params => <CustomTextField {...params} label='Comunidades' placeholder='Selecciona...' />}
                disabled={!trainingContractId || loading}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={populations}
                value={population}
                onChange={(_, v) => {
                  setPopulation(v)
                  const id = v ? oid(v) : null
                  if (id) createFestivals('population', Number(id))
                }}
                getOptionLabel={label}
                isOptionEqualToValue={(o, v) => oid(o) === oid(v)}
                renderInput={params => <CustomTextField {...params} label='Poblaciones' placeholder='Selecciona...' />}
                disabled={!trainingContractId || loading}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                <Button
                  variant='contained'
                  color='warning'
                  onClick={() => createFestivals('nacional', null)}
                  disabled={!trainingContractId || loading}
                  sx={{ minWidth: 280 }}
                >
                  <Icon icon='tabler:plus' fontSize={20} />
                  Añadir Festivos Nacionales
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <FestivalsTable />

      <FestivalDelete />

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default FestivalsTab
