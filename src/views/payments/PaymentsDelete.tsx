// TracingsDelete.tsx

// ** React Imports
import { Fragment, useContext } from 'react'

// ** API
import { deletePayment } from 'src/api/api'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** UI / Utils
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'
import { paymentActions } from 'src/reducers/general/PaymentReducer'

// ** Reducer

const PaymentDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.payment.showEliminateDialog)
  const id = useSelector((state: RootState) => state.payment.id)

  const handleDelete = () => {
    if (!id) return

    deletePayment(id)
      .then(response => {
        if (response.data?.success) {
          dispatch(generalActions.addFilterButtonClickCount())
          toast.success(response.data?.message ?? 'Deleted')
          handleCloseDelete()
        }
      })
      .catch(error => {
        handleCloseDelete()
        handleError(error, logout)
      })
  }

  const handleCloseDelete = () => {
    dispatch(paymentActions.setId(null))
    dispatch(paymentActions.setShowEliminateDialog(false))
  }

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default PaymentDelete
