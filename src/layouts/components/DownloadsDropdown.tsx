import { Fragment, ReactNode, SyntheticEvent, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import { Settings } from 'src/@core/context/settingsContext'
import { downloadGeneralFile, fetchGeneratedFiles } from 'src/api/api'
import { Badge, Box, Theme, Typography, TypographyProps, useMediaQuery } from '@mui/material'
import CustomChip from 'src/@core/components/mui/chip'
import { styled } from '@mui/material/styles'

// ** Third Party Components
import PerfectScrollbarComponent from 'react-perfect-scrollbar'
import { createdAtToDatFormat } from 'src/context/dates'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

interface Props {
  settings: Settings
}

// ** Styled PerfectScrollbar component
const PerfectScrollbar = styled(PerfectScrollbarComponent)({
  maxHeight: 349
})

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <Box sx={{ maxHeight: 349, overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
  } else {
    return <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>{children}</PerfectScrollbar>
  }
}

// ** Styled component for the title in MenuItems
const MenuItemTitle = styled(Typography)<TypographyProps>({
  fontWeight: 500,
  flex: '1 1 100%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis'
})

interface Download {
  id: number
  date: Date | null
  path: string
  name: string
  created_at: string
}

const DownloadsDropdown = ({ settings }: Props) => {
  // ** State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [downloads, setDownloads] = useState<Download[]>([])

  // ** Hooks
  const { t } = useTranslation()
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // ** Vars
  const { layout } = settings

  // ==== Polling control (anti 429) ====
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)
  const BASE_MS = 5 * 60 * 1000 // 5 minutos

  const scheduleNext = (ms: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(fetchOnce, ms)
  }

  const fetchOnce = async () => {
    try {
      const res = await fetchGeneratedFiles()
      if (!isMountedRef.current) return

      const items: Download[] = res.data.data.generated_files.map((f: any) => ({
        ...f,
        date: f.date ? new Date(f.date) : null
      }))
      setDownloads(items)

      // programa próxima ejecución normal
      scheduleNext(BASE_MS)
    } catch (err: any) {
      // maneja error de auth, etc.
      handleError(err, logout)

      // si es 429, respeta Retry-After si viene
      const status = err?.response?.status
      const retryAfterHeader = err?.response?.headers?.['retry-after']
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null

      if (status === 429) {
        scheduleNext(retryAfter ?? 60 * 1000) // reintenta en Retry-After o 60s
      } else {
        scheduleNext(BASE_MS) // próximo intento normal
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    fetchOnce()

    // pausa/retoma al cambiar visibilidad (evita hacer fetch en segundo plano)
    const onVis = () => {
      if (!document.hidden) {
        // refresca al volver a la pestaña
        if (timerRef.current) clearTimeout(timerRef.current)
        fetchOnce()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      isMountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVis)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDropdownOpen = (event: SyntheticEvent) => {
    setAnchorEl(event.currentTarget as HTMLElement)
  }
  const handleDropdownClose = () => setAnchorEl(null)

  // Derivado: cuantos sin fecha (no descargados)
  const unseenCount = useMemo(() => downloads.filter(f => !f.date).length, [downloads])

  const handleDownload = async (file: Download) => {
    try {
      const response = await downloadGeneralFile({ file_name: file.name })

      // Nombre de archivo desde Content-Disposition si viene
      const contentDisposition = response.headers['content-disposition']
      let fileName = file.name
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match && match[1]) fileName = match[1]
      }

      const mimeType = response.headers['content-type'] || 'application/octet-stream'

      const blob = new Blob([response.data], { type: mimeType })
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Marca como visto localmente (si estaba "nuevo")
      setDownloads(prev => prev.map(f => (f.id === file.id ? { ...f, date: f.date ?? new Date() } : f)))
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const files = () => {
    return downloads.map(file => (
      <MenuItem key={file.id} sx={{ py: 2 }} onClick={() => handleDownload(file)}>
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 4, ml: 2.5, flex: '1 1', display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
            <MenuItemTitle>{t('Tu documento esta preparado!')}</MenuItemTitle>
            <Typography variant='body2'>{file.name}</Typography>
          </Box>
          <Typography variant='body2' sx={{ color: 'text.disabled' }}>
            {createdAtToDatFormat(file.created_at)}
          </Typography>
        </Box>
      </MenuItem>
    ))
  }

  return (
    <Fragment>
      {downloads.length > 0 && (
        <Fragment>
          <IconButton
            color='inherit'
            aria-haspopup='true'
            aria-controls='customized-menu'
            onClick={handleDropdownOpen}
            sx={layout === 'vertical' ? { mr: 0.75 } : { mx: 0.75 }}
          >
            <Badge
              color='error'
              variant='dot'
              invisible={unseenCount === 0}
              sx={{
                '& .MuiBadge-badge': {
                  top: 4,
                  right: 4,
                  boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`
                }
              }}
            >
              <Icon icon='tabler:download' />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleDropdownClose}
            sx={{ '& .MuiMenu-paper': { mt: 4, minWidth: 130 } }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              disableRipple
              disableTouchRipple
              sx={{ cursor: 'default', userSelect: 'auto', backgroundColor: 'transparent !important' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Typography variant='h5' sx={{ cursor: 'text' }}>
                  {t('Reports')}
                </Typography>
                {unseenCount > 0 && (
                  <CustomChip skin='light' size='small' color='primary' label={`${unseenCount} ${t('New')}`} />
                )}
              </Box>
            </MenuItem>
            <ScrollWrapper hidden={hidden}>{files()}</ScrollWrapper>
          </Menu>
        </Fragment>
      )}
    </Fragment>
  )
}

export default DownloadsDropdown
