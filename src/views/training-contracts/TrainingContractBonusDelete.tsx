import { Fragment, useContext } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-hot-toast'

import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingContractBonusActions } from 'src/reducers/trainingContracts/TrainingContractBonusReducer'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import DeleteElement from 'src/views/components/DeleteElement'
import { deleteTrainingContractBonus } from 'src/api/api'

const TrainingContractBonusDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((s: RootState) => (s as any).trainingContractBonus?.showEliminateDialog)
  const id = useSelector((s: RootState) => (s as any).trainingContractBonus?.id) as number | null

  const handleClose = () => {
    dispatch(trainingContractBonusActions.setId(null))
    dispatch(trainingContractBonusActions.setShowEliminateDialog(false))
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      const res = await deleteTrainingContractBonus(id)
      if (res?.status === 200) {
        toast.success('Eliminado')
        handleClose()

        // ✅ refresca tabla (igual que haces en BillsDelete)
        dispatch(generalActions.addFilterButtonClickCount())
      } else {
        toast.error(res?.data?.message ?? 'Error')
      }
    } catch (e) {
      handleClose()
      handleError(e, logout)
    }
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleClose} />}</Fragment>
}

export default TrainingContractBonusDelete
