// src/views/trainingContracts/tabs/HistoricalTab.tsx
import { Fragment, MouseEvent, useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Menu, MenuItem } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import { trainingContractIncidenceActions } from 'src/reducers/trainingContracts/TrainingContractIncidenceReducer'
import HistoricalModal from './HistoricalModal'
import HistoricalTable from './HistoricalTable'
import HistoricalDelete from './HistoricalDelete'
import Icon from 'src/@core/components/icon'
import TrainingContractCommunicationDialog, { TrainingContractCommunicationType } from './TrainingContractCommunicationDialog'

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
  const [communicationType, setCommunicationType] = useState<TrainingContractCommunicationType | null>(null)
  const [communicationMenuAnchor, setCommunicationMenuAnchor] = useState<HTMLElement | null>(null)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const openCommunication = (type: TrainingContractCommunicationType) => {
    setCommunicationMenuAnchor(null)
    setCommunicationType(type)
  }

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
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
            <Button
              variant='contained'
              onClick={() => openCommunication('guide')}
              disabled={!trainingContractId}
            >
              Mandar guía tutor
            </Button>
            <Button
              variant='contained'
              color='secondary'
              endIcon={<Icon icon='tabler:chevron-down' />}
              onClick={(event: MouseEvent<HTMLElement>) => setCommunicationMenuAnchor(event.currentTarget)}
              disabled={!trainingContractId}
            >
              Mandar cumplimiento/incumplimiento
            </Button>
            <Menu
              anchorEl={communicationMenuAnchor}
              open={Boolean(communicationMenuAnchor)}
              onClose={() => setCommunicationMenuAnchor(null)}
            >
              <MenuItem onClick={() => openCommunication('compliance')}>Cumplimiento</MenuItem>
              <MenuItem onClick={() => openCommunication('noncompliance')}>Incumplimiento</MenuItem>
            </Menu>
          </Box>
        </CardContent>
      </Card>

      <HistoricalTable open={true} trainingContractId={trainingContractId} refreshKey={historyRefreshKey} />

      <HistoricalModal
        open={modalOpen}
        mode={modalMode}
        trainingContractId={trainingContractId}
        incidenceId={incidenceId}
        onClose={() => dispatch(trainingContractIncidenceActions.closeTrainingContractIncidenceModal())}
      />

      <HistoricalDelete />

      <TrainingContractCommunicationDialog
        open={communicationType !== null}
        trainingContractId={trainingContractId}
        type={communicationType}
        onClose={() => setCommunicationType(null)}
        onSent={() => setHistoryRefreshKey(value => value + 1)}
      />
    </Fragment>
  )
}

export default HistoricalTab
