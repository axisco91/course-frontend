import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

import PopulationFestivalsFilters from 'src/views/population-festivals/PopulationFestivalsFilters'
import PopulationFestivalsTable from 'src/views/population-festivals/PopulationFestivalsTable'
import PopulationFestivalsModal from 'src/views/population-festivals/PopulationFestivalsModal'
import PopulationFestivalsDelete from 'src/views/population-festivals/PopulationFestivalsDelete'

import { populationFestivalActions } from 'src/reducers/trainingContracts/PopulationFestivalReducer'
import { populationActions } from 'src/reducers/general/PopulationReducer'
import { nacionalFestivalActions } from 'src/reducers/trainingContracts/NacionalFestivalReducer'
import { getPopulations, getNacionalFestivals } from 'src/api/api'

const PopulationFestivals = () => {
  const hasPermission = useHasPermission(['read.management'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => (state as any).populationFestival?.modalOpen)
  const modalMode = useSelector((state: RootState) => (state as any).populationFestival?.modalMode)
  const id = useSelector((state: RootState) => (state as any).populationFestival?.id)

  useEffect(() => {
    dispatch(populationFestivalActions.closeModal())
    dispatch(populationFestivalActions.setId(null))
    dispatch(populationFestivalActions.setCurrentPopulationFestival(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [populationsRes, festivalsRes] = await Promise.all([getPopulations(), getNacionalFestivals()])

        if (cancelled) return

        dispatch(populationActions.setPopulations?.(populationsRes.data?.data?.populations ?? []))
        dispatch(nacionalFestivalActions.setNacionalFestivals?.(festivalsRes.data?.data?.nacional_festivals ?? []))
      } catch (error) {
        if (!cancelled) handleError(error, logout)
      } finally {
        if (!cancelled) setShow(true)
      }
    }

    if (hasPermission) fetchGeneralData()
    else setShow(true)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission, dispatch])

  return (
    <Permission requiredPermissions={['read.management']}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <PopulationFestivalsFilters />
              </CardContent>

              <CardContent>
                <PopulationFestivalsTable />
              </CardContent>

              <PopulationFestivalsModal
                open={Boolean(modalOpen)}
                mode={(modalMode ?? 'view') as any}
                populationFestivalId={id}
                onClose={() => dispatch(populationFestivalActions.closeModal())}
              />

              <PopulationFestivalsDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default PopulationFestivals
