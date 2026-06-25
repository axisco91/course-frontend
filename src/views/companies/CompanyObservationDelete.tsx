import { Fragment, useContext } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'

// ✅ API (ajusta nombres/rutas)
import { deleteCompanyObservation } from 'src/api/api'
import { companyObservationActions } from 'src/reducers/company/CompanyObservationReducer'

// ✅ Reducer

const CompanyObservationsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.companyObservation.showEliminateDialog)
  const id = useSelector((state: RootState) => state.companyObservation.id)

  const handleDelete = () => {
    if (!id) return

    deleteCompanyObservation(id)
      .then(res => {
        if (res.data?.success) {
          toast.success(res.data?.message ?? 'Deleted')
          dispatch(generalActions.addFilterButtonClickCount()) // para refrescar tablas si lo usas así
          handleClose()
        }
      })
      .catch(err => {
        handleClose()
        handleError(err, logout)
      })
  }

  const handleClose = () => {
    dispatch(companyObservationActions.setId(null))
    dispatch(companyObservationActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleClose} />}</Fragment>
}

export default CompanyObservationsDelete
