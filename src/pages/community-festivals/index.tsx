import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

import CommunityFestivalsFilters from 'src/views/community-festivals/CommunityFestivalsFilters'
import CommunityFestivalsTable from 'src/views/community-festivals/CommunityFestivalsTable'
import CommunityFestivalsModal from 'src/views/community-festivals/CommunityFestivalsModal'
import CommunityFestivalsDelete from 'src/views/community-festivals/CommunityFestivalsDelete'

import { communityFestivalActions } from 'src/reducers/trainingContracts/CommunityFestivalReducer'
import { communityActions } from 'src/reducers/trainingContracts/CommunityReducer'
import { nacionalFestivalActions } from 'src/reducers/trainingContracts/NacionalFestivalReducer'
import { getCommunities, getNacionalFestivals } from 'src/api/api'

const CommunityFestivals = () => {
  const hasPermission = useHasPermission(['read.management'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => (state as any).communityFestival?.modalOpen)
  const modalMode = useSelector((state: RootState) => (state as any).communityFestival?.modalMode)
  const id = useSelector((state: RootState) => (state as any).communityFestival?.id)

  useEffect(() => {
    dispatch(communityFestivalActions.closeModal())
    dispatch(communityFestivalActions.setId(null))
    dispatch(communityFestivalActions.setCurrentCommunityFestival(null))
  }, [dispatch])

  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [communitiesRes, festivalsRes] = await Promise.all([getCommunities(), getNacionalFestivals()])

        if (cancelled) return

        dispatch(communityActions.setCommunities?.(communitiesRes.data?.data?.communities ?? []))
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
                <CommunityFestivalsFilters />
              </CardContent>

              <CardContent>
                <CommunityFestivalsTable />
              </CardContent>

              <CommunityFestivalsModal
                open={Boolean(modalOpen)}
                mode={(modalMode ?? 'view') as any}
                communityFestivalId={id}
                onClose={() => dispatch(communityFestivalActions.closeModal())}
              />

              <CommunityFestivalsDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default CommunityFestivals
