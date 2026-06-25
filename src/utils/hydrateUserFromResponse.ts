import { authActions } from 'src/reducers/users/AuthReducer'
import { activeCompanyActions } from 'src/reducers/company/ActiveCompanyReducer'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ** Config
import authConfig from 'src/configs/auth'
import { fetchCompanyLanguages } from 'src/api/api'
import { layoutActions } from 'src/reducers/general/LayoutReducer'

export const hydrateUserFromResponse = async (allData: any, dispatch: any, i18n: any, setUser: (user: any) => void) => {
  const {
    accessToken,
    data,
    user,
    permissions,
    companies,
    company_settings,
    home_customizations,
    legal_texts,
    compliance_registration
  } = allData

  setUser({ ...user })
  window.localStorage.setItem(authConfig.storageTokenKeyName, accessToken)
  window.localStorage.setItem('userData', JSON.stringify(data))

  const activeCompany = user.last_company_id

  // Dispatch user and settings data to state
  dispatch(authActions.setAvatar(user.profile_photo_path))
  dispatch(authActions.setFullname(user.fullname))
  dispatch(authActions.setAdministrator(user.administrator))
  dispatch(authActions.setLanguage(user.language))
  dispatch(authActions.setAccessUser(user.default_access))
  dispatch(authActions.setManagerUser(user.default_manager))
  dispatch(authActions.setRemote(user.remote))
  dispatch(authActions.setUser(user))
  dispatch(authActions.setPermissions(permissions))
  dispatch(authActions.setUserCompanies(companies))
  dispatch(activeCompanyActions.setSettings(company_settings))
  dispatch(activeCompanyActions.setId(activeCompany))
  dispatch(generalActions.setHomeCustomizations(home_customizations))
  dispatch(generalActions.setLegalTexts(legal_texts))
  dispatch(authActions.setMustChangePassword(user.change_password_next_login == 1 ? true : false))
  dispatch(authActions.setComplianceRegistrations(compliance_registration == 1 ? true : false))

  //localStorage.setItem('skip_2fa_prompt', user.skip_2fa_prompt)
  dispatch(authActions.setSkip2FaPrompt(user.skip_2fa_prompt == 1 ? true : false))

  i18n.changeLanguage(user.language)

  // Fetch company languages and handle redirection based on default access
  await fetchCompanyLanguages({ company_id: activeCompany })
    .then(response => {
      dispatch(layoutActions.setLanguages(response.data.data.languages))
    })
    .catch()
}
