// src/views/trainingContracts/tabs/HistoricalTab.tsx
import { Fragment, useContext, useEffect, useRef } from 'react'
import { Box, Button, Card, CardContent } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { trainingContractIncidenceActions } from 'src/reducers/trainingContracts/TrainingContractIncidenceReducer'
import HistoricalModal from './HistoricalModal'
import HistoricalTable from './HistoricalTable'
import HistoricalDelete from './HistoricalDelete'

const HistoricalTab = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // refs como siempre
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const modalOpen = useSelector((s: RootState) => (s as any).trainingContractIncidence?.modalOpen) as boolean
  const modalMode = useSelector((s: RootState) => (s as any).trainingContractIncidence?.modalMode) as
    | 'create'
    | 'edit'
    | 'view'
  const incidenceId = useSelector((s: RootState) => (s as any).trainingContractIncidence?.id) as number | null

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant='contained'
              color='warning'
              onClick={() => {
                dispatch(trainingContractIncidenceActions.setId(null))
                dispatch(trainingContractIncidenceActions.openModal({ mode: 'create' }))
              }}
              disabled={!trainingContractId}
            >
              Crear Histórico
            </Button>
          </Box>
        </CardContent>
      </Card>

      <HistoricalTable open={true} trainingContractId={trainingContractId} />

      <HistoricalModal
        open={modalOpen}
        mode={modalMode}
        trainingContractId={trainingContractId}
        incidenceId={incidenceId}
        onClose={() => dispatch(trainingContractIncidenceActions.closeTrainingContractIncidenceModal())}
      />

      <HistoricalDelete />
    </Fragment>
  )
}

export default HistoricalTab
