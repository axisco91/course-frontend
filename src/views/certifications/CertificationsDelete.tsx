import { Fragment, useContext } from 'react'
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { deleteCertification } from 'src/api/api'
import { AuthContext } from 'src/context/AuthContext'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { certificationActions } from 'src/reducers/general/CertificationReducer'
import { RootState } from 'src/reducers/types/types'
import DeleteElement from 'src/views/components/DeleteElement'

const CertificationsDelete = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showEliminateDialog = useSelector((state: RootState) => state.certification.showEliminateDialog)
  const id = useSelector((state: RootState) => state.certification.id)

  const handleCloseDelete = () => {
    dispatch(certificationActions.setId(null))
    dispatch(certificationActions.setShowEliminateDialog(false))
  }

  const handleDelete = () => {
    if (!id) return

    deleteCertification(id)
      .then(response => {
        if (response.data?.success || response.status === 200) {
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

  return (
    <Fragment>{showEliminateDialog && <DeleteElement onDelete={handleDelete} onClose={handleCloseDelete} />}</Fragment>
  )
}

export default CertificationsDelete
