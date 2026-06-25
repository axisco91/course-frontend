import { Fragment, useContext } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { trainingContractBillActions } from 'src/reducers/bills/TrainingContractBillReducer'

import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import DeleteElement from 'src/views/components/DeleteElement'
import { deleteTrainingContractBill } from 'src/api/api'

const TrainingContractBillsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector(
    (state: RootState) => (state as any).trainingContractBill?.showEliminateDialog
  )
  const id = useSelector((state: RootState) => (state as any).trainingContractBill?.id) as number | null

  const handleClose = () => {
    dispatch(trainingContractBillActions.setId(null))
    dispatch(trainingContractBillActions.setShowEliminateDialog(false))
  }

  const handleDelete = async () => {
    if (!id) return

    try {
      const res = await deleteTrainingContractBill(id)

      if (res?.status === 200) {
        toast.success('Eliminado')
        handleClose()
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

export default TrainingContractBillsDelete
