// ** React Imports
import { Fragment, useContext } from 'react'

// ** API
import { convertProvider } from 'src/api/api'

// ** Redux
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

// ** UI / Utils
import { toast } from 'react-hot-toast'
import { generalActions } from 'src/reducers/general/GeneralReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

// ** Reducer
import { companyActions } from 'src/reducers/company/CompanyReducer'
import ConfirmDialog from '../components/ConfirmDialog'

const ProviderDialog = () => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const showProviderDialog = useSelector((state: RootState) => state.company.showProviderDialog)

  // ✅ company id
  const id = useSelector((state: RootState) => state.company.id)

  const handleDelete = () => {
    if (!id) return

    convertProvider(id)
      .then(response => {
        if (response.data?.success) {
          dispatch(generalActions.addFilterButtonClickCount())
          toast.success(response.data?.message ?? 'Converted')
          handleCloseConfirm()
        }
      })
      .catch(error => {
        handleCloseConfirm()
        handleError(error, logout)
      })
  }

  const handleCloseConfirm = () => {
    dispatch(companyActions.setId(null))
    dispatch(companyActions.setShowProviderDialog(false))
  }

  return (
    <Fragment>
      {showProviderDialog && (
        <ConfirmDialog
          onConfirm={handleDelete}
          onClose={handleCloseConfirm}
          title={'Are you sure?'}
          text={'Convert to Provider'}
        />
      )}
    </Fragment>
  )
}

export default ProviderDialog
