import React, { ReactElement, Ref, forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Dialog, DialogContent, Fade, IconButton, Tab, Tabs, Typography } from '@mui/material'
import type { FadeProps } from '@mui/material/Fade'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import Icon from 'src/@core/components/icon'
import { RootState } from 'src/reducers/types/types'
import DocumentTypesGeneralTab from './DocumentTypesGeneralTab'

type Mode = 'view' | 'edit' | 'create'

const Transition = forwardRef(function Transition(props: FadeProps & { children: ReactElement }, ref: Ref<unknown>) {
  return <Fade ref={ref} {...props} />
})

const CustomCloseButton = styled(IconButton)(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}))

type TabPanelProps = {
  value: number
  index: number
  children: React.ReactNode
}

function TabPanel({ value, index, children }: TabPanelProps) {
  if (value !== index) return null

  return <Box sx={{ pt: 4 }}>{children}</Box>
}

interface DocumentTypeModalProps {
  open: boolean
  onClose: () => void
  mode: Mode
  documentId?: number | null
}

const DocumentTypesModal: React.FC<DocumentTypeModalProps> = ({ open, onClose, mode, documentId = null }) => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const [title, setTitle] = useState('')
  const [modeUi, setModeUi] = useState<Mode>(mode)

  const userPermissions = useSelector((state: RootState) => state.auth.permissions)
  const selectedDocument = useSelector((state: RootState) => state.document.selectedDocument)
  const canUpdate = Array.isArray(userPermissions) && userPermissions.includes('edit.management')

  const isCreate = modeUi === 'create'
  const effectiveMode: Mode = isCreate ? 'create' : canUpdate ? modeUi : 'view'

  useEffect(() => {
    if (!open) return
    setTab(0)
    setTitle('')
  }, [open, documentId])

  useEffect(() => {
    if (!open) return

    if (mode === 'create') {
      setModeUi('create')

      return
    }

    if (!canUpdate) {
      setModeUi('view')

      return
    }

    setModeUi(mode)
  }, [open, mode, canUpdate])

  useEffect(() => {
    if (!open || modeUi === 'create') return
    const currentTitle = String(selectedDocument?.name ?? '').trim()
    if (currentTitle) {
      setTitle(currentTitle)
    }
  }, [open, modeUi, selectedDocument])

  const handleLoaded = useCallback((document: any) => {
    setTitle(String(document?.name ?? '').trim())
  }, [])

  const handleRequestEdit = useCallback(() => {
    if (!canUpdate) return
    setModeUi('edit')
  }, [canUpdate])

  const modalTitle = useMemo(() => {
    if (isCreate) return t('Create Document')
    if (effectiveMode === 'edit') return t('Edit Document')

    return title || t('Document details')
  }, [effectiveMode, isCreate, t, title])

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='lg'
      scroll='body'
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{ '& .MuiDialog-paper': { overflow: 'visible' } }}
    >
      <CustomCloseButton onClick={onClose}>
        <Icon icon='tabler:x' fontSize={18} />
      </CustomCloseButton>

      <DialogContent sx={{ pt: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {modalTitle}
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={t('General')} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <DocumentTypesGeneralTab
            open={open}
            mode={effectiveMode}
            documentId={documentId ?? null}
            onClose={onClose}
            onLoaded={handleLoaded}
            onRequestEdit={handleRequestEdit}
          />
        </TabPanel>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentTypesModal
