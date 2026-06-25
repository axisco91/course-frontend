// ** React Import
import { useEffect, useRef } from 'react'

// ** Type Import
import { LayoutProps } from 'src/@core/layouts/types'

// ** Layout Components
import VerticalLayout from './VerticalLayout'
import HorizontalLayout from './HorizontalLayout'

const Layout = (props: LayoutProps) => {
  // ** Props
  const { hidden, children, settings, saveSettings } = props

  // ** Ref
  const isCollapsed = useRef(settings.navCollapsed)

  useEffect(() => {
    const fetchGeneralData = async () => {
      try {
        /*await fetchMenu({ company_id: activeCompanyId })
          .then(res => {
            dispatch(menuActions.setMenuUIData(res.data.data.menu))
          })
          .catch(error => {
            handleError(error, logout)
          })*/
      } catch (error) {
        console.error('Error fetching general data:', error)
      }
    }

    // Call fetchGeneralData initially and then every 5 minutes
    fetchGeneralData()
    const interval = setInterval(fetchGeneralData, 1 * 60 * 1000)

    // Cleanup function
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (hidden) {
      if (settings.navCollapsed) {
        saveSettings({ ...settings, navCollapsed: false, layout: 'vertical' })
        isCollapsed.current = true
      }
    } else {
      if (isCollapsed.current) {
        saveSettings({ ...settings, navCollapsed: true, layout: settings.lastLayout })
        isCollapsed.current = false
      } else {
        if (settings.lastLayout !== settings.layout) {
          saveSettings({ ...settings, layout: settings.lastLayout })
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden])

  if (settings.layout === 'horizontal') {
    return <HorizontalLayout {...props}>{children}</HorizontalLayout>
  }

  return <VerticalLayout {...props}>{children}</VerticalLayout>
}

export default Layout
