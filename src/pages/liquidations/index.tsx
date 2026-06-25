// Liquidations.tsx
import Grid from '@mui/material/Grid'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Permission from 'src/views/components/Permission'
import useHasPermission from 'src/context/hasPermission'
import { Card, CardContent } from '@mui/material'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { RootState } from 'src/reducers/types/types'

// ✅ views
import LiquidationsFilters from 'src/views/liquidations/LiquidationsFilters'
import LiquidationsTable from 'src/views/liquidations/LiquidationsTable'
import LiquidationsModal from 'src/views/liquidations/LiquidationsModal'
import LiquidationsDelete from 'src/views/liquidations/LiquidationsDelete'

// ✅ reducers
import { liquidationActions } from 'src/reducers/liquidations/LiquidationReducer'

// ✅ API
import { getAdvisors, getCompanies, getCourses } from 'src/api/api'

// ✅ student modal
import CompaniesModal from 'src/views/companies/CompaniesModal'
import { companyActions } from 'src/reducers/company/CompanyReducer'
import { advisorActions } from 'src/reducers/advisors/AdvisorReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'

const Liquidations = () => {
  const hasPermission = useHasPermission(['read.liquidations'])
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const [show, setShow] = useState(false)

  const modalOpen = useSelector((state: RootState) => state.liquidation.modalOpen)
  const modalMode = useSelector((state: RootState) => state.liquidation.modalMode)
  const liquidationId = useSelector((state: RootState) => state.liquidation.id)
  const companyModalOpen = useSelector((state: RootState) => state.company.modalOpen)
  const companyModalMode = useSelector((state: RootState) => state.company.modalMode)
  const companyId = useSelector((state: RootState) => state.company.id)

  // ✅ reset UI when entering the page
  useEffect(() => {
    dispatch(liquidationActions.closeLiquidationModal?.() ?? { type: 'liquidation/closeLiquidationModal' })
    dispatch(liquidationActions.setId?.(null) ?? { type: 'liquidation/setId', payload: null })
    dispatch(companyActions.closeCompanyModal())
    dispatch(companyActions.setId(null))
  }, [dispatch])

  // ✅ load master data
  useEffect(() => {
    let cancelled = false

    const fetchGeneralData = async () => {
      try {
        const [companiesRes, advisorsRes, coursesRes] = await Promise.all([
          getCompanies({ show_inactive: 'false' }),
          getAdvisors({ show_inactive: 'false' }),
          getCourses({})
        ])

        if (cancelled) return

        dispatch(companyActions.setCompanies?.(companiesRes.data?.data?.companies ?? []))

        dispatch(advisorActions.setAdvisors?.(advisorsRes.data?.data?.advisors ?? []))

        dispatch(courseActions.setCourses?.(coursesRes.data?.data?.courses ?? []))
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
    <Permission requiredPermissions={['read.liquidations']}>
      <Grid container spacing={6}>

        <Grid item xs={12}>
          {show && (
            <Card>
              <CardContent>
                <LiquidationsFilters />
              </CardContent>

              <CardContent>
                <LiquidationsTable />
              </CardContent>

              <LiquidationsModal
                open={modalOpen}
                mode={modalMode}
                liquidationId={liquidationId}
                onClose={() =>
                  dispatch(
                    liquidationActions.closeLiquidationModal?.() ?? { type: 'liquidation/closeLiquidationModal' }
                  )
                }
              />
              <CompaniesModal
                open={companyModalOpen}
                mode={companyModalMode}
                companyId={companyId}
                onClose={() => dispatch(companyActions.closeCompanyModal())}
              />
              <LiquidationsDelete />
            </Card>
          )}
        </Grid>
      </Grid>
    </Permission>
  )
}

export default Liquidations
