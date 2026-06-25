// ** MUI Imports
import { Button } from '@mui/material'

// ** ThirdParty Components
import { useTranslation } from 'react-i18next'

// ** Utils Import
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import SearchBar from '../../components/SearchBar'
import { useRouter } from 'next/router'
import Filter from '../../components/Filter'
import { useDispatch } from 'react-redux'
import { roleActions } from 'src/reducers/management/RoleReducer'
import Icon from 'src/@core/components/icon'
import { Fragment } from 'react'

const RolesFilters = () => {
  // Traducciones
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useDispatch()

  // ** Selectors
  const searchValue = useSelector((state: RootState) => state.role.searchText)

  return (
    <Filter
      searchBar={
        <SearchBar
          value={searchValue}
          clearSearch={() => dispatch(roleActions.setSearchText(''))}
          onChange={event => dispatch(roleActions.setSearchText(event.target.value))}
        />
      }
      actions={
        <Fragment>
          <Button
            variant='contained'
            sx={{ mr: 4 }}
            type='submit'
            onClick={() => router.push('/general-settings/roles/create')}
          >
            <Icon icon='tabler:plus' fontSize={20} />
            {t('New')}
          </Button>
        </Fragment>
      }
    ></Filter>
  )
}

export default RolesFilters
