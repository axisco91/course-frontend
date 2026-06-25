import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, IconButton, Tooltip, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import Icon from 'src/@core/components/icon'
import LoadingDialog from 'src/views/components/LoadingDialog'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'
import { generalActions } from 'src/reducers/general/GeneralReducer'

// ✅ AJUSTA a tu endpoint real (listado):
import { getCompanyIncidences } from 'src/api/api'

// ✅ modal
import CompanyIncidenceModal from './CompanyIncidenceModal'
import { companyIncidenceActions } from 'src/reducers/company/CompanyIncidenceReducer'

// ✅ reducer incidencias (AJUSTA RUTA/NOMBRE)

type Props = {
  open: boolean
  companyId: number | null
}

type Mode = 'create' | 'edit'

const CompanyIncidenceTable = ({ open, companyId }: Props) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => void (handleErrorRef.current = handleError), [handleError])
  useEffect(() => void (logoutRef.current = logout), [logout])

  // ✅ para recargar cuando se guarda / se borra (tu patrón)
  const filterButtonClickCount = useSelector((s: RootState) => s.general.filterButtonClickCount)

  // ✅ modal state local
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('create')
  const [editingId, setEditingId] = useState<number | null>(null)

  const openCreate = () => {
    setMode('create')
    setEditingId(null)
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    setMode('edit')
    setEditingId(id)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
  }

  // ✅ listado
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const reqIdRef = useRef(0)

  const fetchIncidences = useCallback(async () => {
    if (!open || !companyId) return

    const myReqId = ++reqIdRef.current
    setLoading(true)
    try {
      const res = await getCompanyIncidences(companyId)

      if (myReqId !== reqIdRef.current) return

      // ajusta la key real:
      setItems(res.data?.data?.company_incidences ?? [])
    } catch (e) {
      if (myReqId === reqIdRef.current) handleErrorRef.current(e, logoutRef.current)
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false)
    }
  }, [open, companyId])

  // carga inicial
  useEffect(() => {
    fetchIncidences()
  }, [fetchIncidences])

  // recarga cuando sube el contador (guardar/borrar/etc)
  useEffect(() => {
    if (!open || !companyId) return
    fetchIncidences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterButtonClickCount])

  // ✅ Delete: SOLO dispara el modal global
  const handleDelete = (id: number) => {
    dispatch(companyIncidenceActions.setId(id))
    dispatch(companyIncidenceActions.setShowEliminateDialog(true))
  }

  const buildTitle = (it: any) => {
    const affair = it?.affair ?? ''
    const type = it?.incidence_type?.name ?? it?.type?.name ?? it?.incidence_type_name ?? ''
    const user = it?.user?.name ? `${it.user.name} ${it.user.surname ?? ''}`.trim() : it?.user_name ?? it?.user ?? ''

    // "prueba - LLAMADA - Francisco ..."
    return [affair, type, user].filter(Boolean).join(' - ') || t('Incidence')
  }

  const notes = (it: any) => it?.notes ?? it?.note ?? ''

  return (
    <Card>
      <CardContent>
        {/* Header + botón */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ fontWeight: 700 }}>
            {t('Incidences')}
          </Typography>

          <Button variant='contained' onClick={openCreate} disabled={!companyId || loading}>
            <Icon icon='tabler:plus' fontSize={20} />
            {t('New')}
          </Button>
        </Box>

        {/* Cards */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((it: any) => {
            const id = Number(it?.id)

            return (
              <Card key={id} variant='outlined'>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='h6' sx={{ fontWeight: 700 }} noWrap>
                      {buildTitle(it)}
                    </Typography>

                    <Typography variant='body2' sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
                      {notes(it)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Tooltip title={t('Edit')} placement='top'>
                      <IconButton size='small' onClick={() => openEdit(id)}>
                        <Icon icon='tabler:edit' fontSize={20} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t('Delete')} placement='top'>
                      <IconButton size='small' onClick={() => handleDelete(id)}>
                        <Icon icon='tabler:trash' fontSize={20} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            )
          })}

          {!loading && items.length === 0 && (
            <Typography variant='body2' sx={{ opacity: 0.7 }}>
              {t('No incidences')}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Modal create/edit */}
      {companyId && (
        <CompanyIncidenceModal
          open={modalOpen}
          mode={mode}
          companyId={companyId}
          incidenceId={editingId}
          onClose={closeModal}
          onSaved={() => {
            closeModal()

            // ✅ esto hace que el Tab recargue por tu patrón
            dispatch(generalActions.addFilterButtonClickCount())
          }}
        />
      )}

      {loading && <LoadingDialog />}
    </Card>
  )
}

export default CompanyIncidenceTable
