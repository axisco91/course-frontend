import { useMemo } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Type Import
import { Settings } from 'src/@core/context/settingsContext'

// ** Components
import UserDropdown from '../UserDropdown'
import UserLanguageDropdown from '../UserLanguageDropdown'
import { useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Translations from 'src/layouts/components/Translations'
import navigation from 'src/navigation/vertical'
import { VerticalNavItemsType } from 'src/@core/layouts/types'
import TracingNotificationDropdown from '../shared-components/TracingNotificationDropdown'

interface Props {
  hidden: boolean
  settings: Settings
  toggleNavVisibility: () => void
  saveSettings: (values: Settings) => void
}

const AppBarContent = (props: Props) => {
  // ** Props
  const { hidden, settings, toggleNavVisibility } = props
  const logo = useSelector((state: RootState) => state.layout.logo)
  const menuUIData = useSelector((state: RootState) => state.menu)
  const router = useRouter()
  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const pageTitle = useMemo(() => {
    const flattenItems = (items: VerticalNavItemsType): Array<{ title: string; path: string }> => {
      const out: Array<{ title: string; path: string }> = []

      items.forEach((item: any) => {
        if (item?.path && item?.title) out.push({ title: item.title, path: item.path })
        if (Array.isArray(item?.children)) out.push(...flattenItems(item.children))
      })

      return out
    }

    const navItems = navigation(userPermissions || [], (menuUIData as any) || [])
    const currentPath = router.pathname
    const candidates = flattenItems(navItems).filter(
      item => currentPath === item.path || currentPath.startsWith(`${item.path}/`)
    )
    if (candidates.length === 0) return null

    return candidates.sort((a, b) => b.path.length - a.path.length)[0].title
  }, [menuUIData, router.pathname, userPermissions])

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {hidden ? (
          <IconButton color='success' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <Icon fontSize='1.5rem' icon='tabler:menu-2' />
          </IconButton>
        ) : null}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
          {logo && <img src={logo} width={100} alt='' />}
          {pageTitle ? (
            <Typography variant='h5' sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              <Translations text={pageTitle} />
            </Typography>
          ) : null}
        </Box>
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <UserLanguageDropdown settings={settings} />
        <TracingNotificationDropdown />
        {userPermissions.includes('global.errors') && (
          <IconButton color='inherit' aria-haspopup='true' onClick={() => router.push(`/errors`)}>
            <Icon fontSize='1.625rem' icon='tabler:exclamation-circle' />
          </IconButton>
        )}
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
