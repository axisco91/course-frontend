// src/views/trainingContracts/tabs/HistoricalDelete.tsx
import { Fragment, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { toast } from 'react-hot-toast'
import DeleteElement from 'src/views/components/DeleteElement'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingContractIncidenceActions } from 'src/reducers/trainingContracts/TrainingContractIncidenceReducer'

// ✅ API (ajusta nombre real)
import { deleteTrainingContractIncidence } from 'src/api/api'

const HistoricalDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((s: RootState) => (s as any).trainingContractIncidence?.showEliminateDialog)
  const id = useSelector((s: RootState) => (s as any).trainingContractIncidence?.id) as number | null

  const close = () => {
    dispatch(trainingContractIncidenceActions.setId(null))
    dispatch(trainingContractIncidenceActions.setShowEliminateDialog(false))
  }

  const onDelete = async () => {
    if (!id) return
    try {
      const res = await deleteTrainingContractIncidence(id)
      if (res.data?.success ?? res.status === 200) {
        toast.success(res.data?.message ?? 'Deleted')
        dispatch(generalActions.addFilterButtonClickCount()) // ✅ refresca tabla
      }
    } catch (e) {
      handleError(e, logout)
    } finally {
      close()
    }
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={onDelete} onClose={close} />}</Fragment>
}

export default HistoricalDelete
