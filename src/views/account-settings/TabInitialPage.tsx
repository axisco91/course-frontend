// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'

// ** React/Redux/i18n
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { RootState } from 'src/reducers/types/types'

// ** API
import { fetchUserPages, storeUserPage } from 'src/api/api' // GET visible pages + current selection
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { FormControl, FormLabel, Radio, RadioGroup } from '@mui/material'

type Page = {
  id: number
  name: string
  route_key: string
  path: string
  packet_id: number | null
  manager_only: 0 | 1
  active: 0 | 1
}

type UserPage = {

  // adapta a tu payload real; nos vale con el id de page
  start_page_id: number | null
}

const TabInitialPage = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)
  const activeCompanyId = useSelector((state: RootState) => state.activeCompany.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pages, setPages] = useState<Page[]>([])
  const [userPage, setUserPage] = useState<UserPage | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)

  // carga datos una vez
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchUserPages({ company_id: activeCompanyId })
        const pgs: Page[] = res.data.data.pages ?? []
        const up: UserPage | null = res.data.data.user_page ?? null

        setPages(pgs)
        setUserPage(up)

        // si no hay selección del usuario, usar Home (por route_key) o la primera
        const home = pgs.find(p => p.route_key === 'home') || pgs[0] || null
        const initialId = up?.start_page_id ?? home?.id ?? null
        setSelectedPageId(initialId)
      } finally {
        setLoading(false)
      }
    }
    if (loading) load()
  }, [activeCompanyId, dispatch, loading])

  const handleSelect = async (pageId: number) => {
    if (pageId === selectedPageId) return
    const prev = selectedPageId

    setSelectedPageId(pageId) // desmarca el anterior y marca el nuevo
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('page_id', pageId.toString()) // deja el nombre como lo tienes
      formData.append('company_id', activeCompanyId.toString())

      await storeUserPage(formData)

      setUserPage({ start_page_id: pageId })
    } catch (error) {
      setSelectedPageId(prev) // rollback si falla
      handleError(error, logout)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={t('Initial Page')} />
          <CardContent>
            {loading ? (
              <CircularProgress />
            ) : pages.length === 0 ? (
              <em>{t('No pages available')}</em>
            ) : (
              <FormControl component='fieldset' disabled={saving}>
                <FormLabel component='legend'>{t('Choose your start page')}</FormLabel>

                <RadioGroup
                  name='start-page'
                  value={selectedPageId ?? ''}
                  onChange={(_, val) => handleSelect(Number(val))}
                  row
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2, // espacio entre radios
                    mt: 1
                  }}
                >
                  {pages.map(page => (
                    <FormControlLabel
                      key={page.id}
                      value={page.id}
                      control={<Radio />}
                      label={page.name}
                      sx={{ mr: 3, mb: 1 }} // margen derecho e inferior
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TabInitialPage
