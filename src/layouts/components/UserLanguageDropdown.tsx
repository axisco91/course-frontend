import { Fragment, SyntheticEvent, useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { Settings } from 'src/@core/context/settingsContext'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { authActions } from 'src/reducers/users/AuthReducer'
import { updateUserLanguage } from 'src/api/api'
import { useRouter } from 'next/router'

interface Props {
  settings: Settings
}

const UserLanguageDropdown = ({ settings }: Props) => {
  // ** State
  const [anchorEl, setAnchorEl] = useState<any>(null)

  // ** Hook
  const { i18n } = useTranslation()

  // ** Var
  const { layout } = settings

  const dispatch = useDispatch()
  const router = useRouter()

  // Obtenemos idiomas de la empresa
  const companyLanguages = useSelector((state: RootState) => state.layout.languages)

  const handleLangDropdownOpen = (event: SyntheticEvent) => {
    setAnchorEl(event.currentTarget)
  }
  const handleLangDropdownClose = () => {
    setAnchorEl(null)
  }
  const handleLangItemClick = (id: number, language: string) => {
    // Asignamos el nuevo idioma al trabajador
    dispatch(authActions.setLanguage(language))
    i18n.changeLanguage(language)

    // Guardamos el nuevo idioma en la BD
    const formData = new FormData()
    formData.append('language_id', id.toString())
    updateUserLanguage(formData)
      .then(response => {
        router.reload()
      })
      .catch(err => {})

    handleLangDropdownClose()
  }

  // Mostramos los idiomas que tiene la empresa asignado
  const languages = () => {
    return companyLanguages.map(language => (
      <MenuItem
        key={language.id}
        sx={{ py: 2 }}
        selected={i18n.language === language.alias}
        onClick={() => handleLangItemClick(language.id, language.alias)}
      >
        {language.name}
      </MenuItem>
    ))
  }

  return (
    <Fragment>
      {languages.length > 0 && (
        <Fragment>
          <IconButton
            color='inherit'
            aria-haspopup='true'
            aria-controls='customized-menu'
            onClick={handleLangDropdownOpen}
            sx={layout === 'vertical' ? { mr: 0.75 } : { mx: 0.75 }}
          >
            <Icon icon='tabler:language' />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleLangDropdownClose}
            sx={{ '& .MuiMenu-paper': { mt: 4, minWidth: 130 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {languages()}
          </Menu>
        </Fragment>
      )}
    </Fragment>
  )
}

export default UserLanguageDropdown
