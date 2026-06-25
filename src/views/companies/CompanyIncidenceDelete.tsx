import { Fragment, useContext } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'

import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import DeleteElement from '../components/DeleteElement'

// ✅ API (ajusta nombres/rutas)
import { deleteCompanyIncidence } from 'src/api/api'
import { companyIncidenceActions } from 'src/reducers/company/CompanyIncidenceReducer'

// ✅ Reducer

const CompanyIncidenceDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.companyIncidence.showEliminateDialog)
  const id = useSelector((state: RootState) => state.companyIncidence.id)

  const handleDelete = () => {
    if (!id) return

    deleteCompanyIncidence(id)
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
    dispatch(companyIncidenceActions.setId(null))
    dispatch(companyIncidenceActions.setShowEliminateDialog(false))
  }

  return <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleClose} />}</Fragment>
}

export default CompanyIncidenceDelete
