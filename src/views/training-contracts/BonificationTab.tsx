import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, Card, CardContent } from '@mui/material'
import Icon from 'src/@core/components/icon'
import toast from 'react-hot-toast'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import LoadingDialog from 'src/views/components/LoadingDialog'

// ✅ API
import { generateTrainingContractBonus } from 'src/api/api'

// ✅ reducers
import { trainingContractBonusActions } from 'src/reducers/trainingContracts/TrainingContractBonusReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ views
import TrainingContractBonusInfo from './TrainingContractBonusInfo'
import TrainingContractBonusTable from './TrainingContractBonusTable'
import TrainingContractBonusDelete from './TrainingContractBonusDelete'
import TrainingContractBonusModal from './TrainingContractBonusModel'

const BonificationTab = ({ open, mode }: { open: boolean; mode: 'view' | 'edit' | 'create' }) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  const trainingContractId = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const modalOpen = useSelector((s: RootState) => (s as any).trainingContractBonus?.modalOpen) as boolean

  const totalAmount = useSelector((s: RootState) => (s as any).trainingContract?.totalAmount ?? 0) as number

  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!trainingContractId) return
    setLoading(true)
    try {
      const res = await generateTrainingContractBonus(trainingContractId)
      if (res?.status === 200) {
        toast.success('Bonificados guardados!')

        // ✅ hace que la tabla refetchee
        dispatch(generalActions.addFilterButtonClickCount())
      } else {
        toast.error(res?.data?.message ?? 'Error')
      }
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    dispatch(trainingContractBonusActions.setId(null))
    dispatch(trainingContractBonusActions.setSelectedTrainingContractBonus(null))
    dispatch(trainingContractBonusActions.openModal({ mode: 'create' }))
  }

  const disabledAll = !open || mode === 'view' || !trainingContractId

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Button variant='contained' color='warning' onClick={handleGenerate} disabled={disabledAll}>
              <Icon icon='tabler:settings' fontSize={20} />
              Generar Bonificaciones
            </Button>

            <Button variant='contained' color='warning' onClick={handleCreate} disabled={disabledAll}>
              <Icon icon='tabler:plus' fontSize={20} />
              Crear Bonificación
            </Button>
          </Box>
        </CardContent>
      </Card>

      <TrainingContractBonusInfo totalAmount={totalAmount} />

      <Card>
        <CardContent>
          <TrainingContractBonusTable disabledAll={disabledAll} open={open} />
        </CardContent>
      </Card>

      <TrainingContractBonusModal open={modalOpen} trainingContractId={trainingContractId} />
      <TrainingContractBonusDelete />

      {loading && <LoadingDialog />}
    </Fragment>
  )
}

export default BonificationTab
