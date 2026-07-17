// src/views/training-contracts/tabs/TrainingContractFormationTab.tsx
import Autocomplete from 'src/views/components/GuardedAutocomplete'
import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Divider, Grid, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from '@mui/material'
import { DataGrid, GridRenderCellParams } from 'src/views/components/DataGrid'

import Icon from 'src/@core/components/icon'
import CustomTextField from 'src/@core/components/mui/text-field'

import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { ReactSortable } from 'react-sortablejs'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'src/reducers/types/types'

import {
  calculateTrainingContractHours,
  createTrainingContractElement,
  deleteTrainingContract_element,
  orderElements,
  register,
  deleteExamTutorial,
  getTrainingContractElementsWithId,
  getTrainingContractSpecialties,
  getProfessionalFamilies
} from 'src/api/api'

import { trainingContractActions } from 'src/reducers/trainingContracts/TrainingContractReducer'
import { courseActions } from 'src/reducers/courses/CourseReducer'
import { examTutorialActions } from 'src/reducers/trainingContracts/ExamTutorialReducer'
import { useErrorHandler } from 'src/hooks/useErrorHandler'
import { AuthContext } from 'src/context/AuthContext'

import EditElementDatesDialog from './EditElementDatesDialog'
import EditTutorDialog from './EditTutorDialog'
import ExamTutorialDialog from './ExamTutorialDialog'

// ✅ NUEVOS DIALOGS (en ficheros separados)

type Option = {
  value: number
  label: string
  total_hours?: number
  course_origin_id?: number
  professional_family_id?: number
  face_to_face_hours?: number
  teletraining_hours?: number
}

type ProfessionalFamilyOption = {
  value: number
  label: string
}

type ElementRow = any

const safeNum = (v: any) => {
  const n = Number(String(v ?? '').replace(',', '.'))

  return Number.isFinite(n) ? n : 0
}

const isHighlightedCourseOrigin = (item: { course_origin_id?: number | string } | null | undefined) =>
  Number(item?.course_origin_id) === 1

const getElementHours = (element: ElementRow | null | undefined) =>
  safeNum(
    element?.training_action_total_hours ??
      element?.certification_total_hours ??
      element?.training_action?.total_hours ??
      element?.certification?.total_hours ??
      element?.total_hours
  )

type ConfirmState = {
  open: boolean
  title: string
  description?: string
  loading?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => Promise<void> | void
}

// ✅ estados de los diálogos externos
type EditDatesState = {
  open: boolean
  element: ElementRow | null
}

type EditTutorState = {
  open: boolean
  element: ElementRow | null
}

const TrainingContractFormationTab: React.FC<{ open: boolean }> = ({ open }) => {
  const dispatch = useDispatch()
  const { handleError } = useErrorHandler()
  const { logout } = useContext(AuthContext)

  // refs (patrón estable)
  const handleErrorRef = useRef(handleError)
  const logoutRef = useRef(logout)
  useEffect(() => {
    handleErrorRef.current = handleError
  }, [handleError])
  useEffect(() => {
    logoutRef.current = logout
  }, [logout])

  // Redux
  const id = useSelector((s: RootState) => (s as any).trainingContract?.id) as number | null
  const plannedItineraryHours = useSelector((s: RootState) => (s as any).trainingContract?.hours) as any

  const formationPlannedTotal = useSelector((s: RootState) => (s as any).trainingContract?.totalFormationHours) as any
  const dailyHours1 = useSelector((s: RootState) => (s as any).trainingContract?.dailyHours1) as any
  const dailyHours2 = useSelector((s: RootState) => (s as any).trainingContract?.dailyHours2) as any
  const totalDays = useSelector((s: RootState) => (s as any).trainingContract?.totalDays) as any

  const elements = useSelector((s: RootState) => (s as any).trainingContract?.elements) as ElementRow[]
  const specialties = useSelector((s: RootState) => (s as any).trainingContract?.specialties) as Option[]
  const certifications = useSelector((s: RootState) => (s as any).trainingContract?.certifications) as Option[]

  const hoursCalculated = useSelector((s: RootState) => (s as any).trainingContract?.hoursCalculated) as boolean
  const selectedContract = useSelector((s: RootState) => (s as any).trainingContract?.trainingContract) as any
  const examsTutorials = useSelector((s: RootState) => (s as any).examTutorial?.examsTutorials) as any[]

  // Local state
  const [loadingCalc, setLoadingCalc] = useState(false)
  const [professionalFamilies, setProfessionalFamilies] = useState<ProfessionalFamilyOption[]>([])
  const [selectedProfessionalFamily, setSelectedProfessionalFamily] = useState<ProfessionalFamilyOption | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState<Option | null>(null)
  const [selectedCertification, setSelectedCertification] = useState<Option | null>(null)

  const [sortedList, setSortedList] = useState<ElementRow[]>([])
  const sortedListRef = useRef<ElementRow[]>([])
  const [isOrdering, setIsOrdering] = useState(false)

  // ✅ dialogs externos
  const [editDates, setEditDates] = useState<EditDatesState>({ open: false, element: null })
  const [editTutor, setEditTutor] = useState<EditTutorState>({ open: false, element: null })

  // Confirm (ya lo tenías)
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, title: '' })
  const closeConfirm = useCallback(
    () => setConfirm(prev => ({ ...prev, open: false, loading: false, onConfirm: undefined })),
    []
  )
  const openConfirm = useCallback((cfg: Omit<ConfirmState, 'open' | 'loading'>) => {
    setConfirm({
      open: true,
      loading: false,
      title: cfg.title,
      description: cfg.description,
      confirmText: cfg.confirmText ?? 'Aceptar',
      cancelText: cfg.cancelText ?? 'Cancelar',
      onConfirm: cfg.onConfirm
    })
  }, [])
  const runConfirm = useCallback(async () => {
    try {
      setConfirm(prev => ({ ...prev, loading: true }))
      await confirm.onConfirm?.()
      closeConfirm()
    } catch {
      closeConfirm()
    }
  }, [confirm.onConfirm, closeConfirm])

  // ✅ SIN mode: se deshabilita todo si la tab NO está abierta
  const disabledAll = !open

  // ✅ Sync sortable (clonar objetos para que Sortable pueda mutar props internos)
  useEffect(() => {
    const list = Array.isArray(elements) ? elements : []
    const mutableList = list.map(el => ({ ...el }))
    setSortedList(mutableList)
    sortedListRef.current = mutableList
  }, [elements])

  // Cargar planned + elements al entrar
  const loadFormation = useCallback(async () => {
    if (!id) return
    const r = await getTrainingContractElementsWithId(id)
    const payload = r?.data?.data ?? r?.data ?? {}
    dispatch(trainingContractActions.setElements(payload.elements ?? []))
    dispatch(trainingContractActions.setHours(payload.planned ?? 0))
  }, [id, dispatch])

  useEffect(() => {
    if (!open || !id) return
    let cancelled = false

    ;(async () => {
      try {
        await loadFormation()
        if (cancelled) return
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, id, loadFormation])

  // cargar specialties al entrar
  const loadSpecialties = useCallback(async () => {
    if (!id) return
    const res = await getTrainingContractSpecialties(id)
    dispatch(trainingContractActions.setSpecialties(res.data?.data?.training_action_specialties ?? []))
  }, [id, dispatch])

  useEffect(() => {
    if (!open || !id) return
    ;(async () => {
      try {
        await loadSpecialties()
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      }
    })()
  }, [open, id, loadSpecialties])

  useEffect(() => {
    setSelectedProfessionalFamily(null)
  }, [id])

  useEffect(() => {
    if (!open || Number(selectedContract?.specialty) !== 1 || professionalFamilies.length > 0) return

    ;(async () => {
      try {
        const res = await getProfessionalFamilies({ perPage: 1000 })
        const families = res.data?.data?.professional_families ?? res.data?.data?.data ?? []
        setProfessionalFamilies(
          families.map((family: any) => ({
            value: Number(family.value ?? family.id),
            label: String(family.label ?? family.name ?? '')
          }))
        )
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
      }
    })()
  }, [open, selectedContract?.specialty, professionalFamilies.length])

  // filtered options
  const filteredSpecialties = useMemo(() => {
    const els = Array.isArray(elements) ? elements : []
    const specs = Array.isArray(specialties) ? specialties : []

    return specs.filter(opt => {
      const alreadyAdded = els.some(el => Number(el?.training_action_id) === Number(opt.value))
      const matchesProfessionalFamily = selectedProfessionalFamily
        ? Number(opt.professional_family_id) === Number(selectedProfessionalFamily.value)
        : true

      return !alreadyAdded && matchesProfessionalFamily
    })
  }, [specialties, elements, selectedProfessionalFamily])

  const filteredCertifications = useMemo(() => {
    const els = Array.isArray(elements) ? elements : []
    const certs = Array.isArray(certifications) ? certifications : []

    return certs.filter(opt => !els.some(el => Number(el?.certification_id) === Number(opt.value)))
  }, [certifications, elements])

  // bonificables
  const bonificables = useMemo(() => {
    return safeNum(selectedContract?.bonus_hours_first_year) + safeNum(selectedContract?.bonus_hours_second_year)
  }, [selectedContract?.bonus_hours_first_year, selectedContract?.bonus_hours_second_year])

  const diff = useMemo(
    () => safeNum(plannedItineraryHours) - safeNum(bonificables),
    [plannedItineraryHours, bonificables]
  )
  const exceeded = diff > 0 ? diff : 0
  const remaining = diff < 0 ? Math.abs(diff) : 0

  // ✅ lock (ajusta lógica si la tienes más compleja)
  const isOnLeaveDateInRange = useCallback(() => {
    return Boolean(selectedContract?.on_leave_date)
  }, [selectedContract?.on_leave_date])

  // Calcular itinerario
  const doCalculate = useCallback(async () => {
    if (!id) return
    setLoadingCalc(true)
    try {
      const response = await calculateTrainingContractHours(id, {})
      if (response?.status !== 200) {
        toast.error(response?.data?.message ?? 'No se pudo actualizar el itinerario.')

        return
      }

      toast.success('Itinerario actualizado')
      const data = response.data ?? {}

      dispatch(trainingContractActions.setFormationHours(data.total_hours))
      dispatch(trainingContractActions.setFormativeHoursFirstYear(data.formative_hours_first_year))
      dispatch(trainingContractActions.setFormativeHoursSecondYear(data.formative_hours_second_year))
      dispatch(trainingContractActions.setDailyHours1(data.daily_hours_1))
      dispatch(trainingContractActions.setDailyHours2(data.daily_hours_2))
      dispatch(trainingContractActions.setTotalDays(data.total_days))

      if (Array.isArray(data.updated_elements) && data.updated_elements.length > 0) {
        dispatch(trainingContractActions.setElements(data.updated_elements))
      }

      dispatch(trainingContractActions.setCalculatedHours(true))
      await loadFormation()
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
      toast.error('No se pudo actualizar el itinerario.')
    } finally {
      setLoadingCalc(false)
    }
  }, [id, dispatch, loadFormation])

  const handleCalculate = useCallback(() => {
    if (!id) return
    openConfirm({
      title: '¿Actualizar itinerario?',
      description: 'Se recalcularán las horas y las fechas del itinerario.',
      confirmText: 'Actualizar',
      cancelText: 'Cancelar',
      onConfirm: doCalculate
    })
  }, [id, openConfirm, doCalculate])

  useEffect(() => {
    if (hoursCalculated && Array.isArray(elements) && elements.length > 0) {
      dispatch(trainingContractActions.setCalculatedHours(false))
    }
  }, [hoursCalculated, elements, dispatch])

  // Add element
  const addElement = useCallback(
    async (opt: Option, type: 'training_action_id' | 'certification_id') => {
      if (!id || !opt?.value) return
      try {
        const formData = new FormData()
        formData.append('id', String(opt.value))
        formData.append('element_type', type)

        const response = await createTrainingContractElement(id, formData)
        if (response?.status !== 200) {
          toast.error(response?.data?.message ?? 'No se pudo añadir el elemento')

          return
        }

        toast.success('Elemento añadido!')
        const payload = response.data ?? {}
        const element = payload.element ?? payload.data?.element ?? payload?.element
        const trainingAction = payload.training_action ?? payload.data?.training_action
        const certification = payload.certification ?? payload.data?.certification
        const elementWithHours: ElementRow = {
          ...element,
          course_origin_id: element?.course_origin_id ?? trainingAction?.course_origin_id ?? opt.course_origin_id
        }

        if (type === 'training_action_id') {
          elementWithHours.training_action_face_to_face_hours =
            element?.training_action_face_to_face_hours ?? trainingAction?.face_to_face_hours ?? opt.face_to_face_hours ?? 0
          elementWithHours.training_action_teletraining_hours =
            element?.training_action_teletraining_hours ?? trainingAction?.teletraining_hours ?? opt.teletraining_hours ?? 0
        }

        if (type === 'certification_id') {
          elementWithHours.certification_face_to_face_hours =
            element?.certification_face_to_face_hours ?? certification?.face_to_face_hours ?? opt.face_to_face_hours ?? 0
          elementWithHours.certification_teletraining_hours =
            element?.certification_teletraining_hours ?? certification?.teletraining_hours ?? opt.teletraining_hours ?? 0
        }

        dispatch(trainingContractActions.addElement(elementWithHours))
        dispatch(trainingContractActions.setHours(safeNum(plannedItineraryHours) + safeNum(opt.total_hours ?? getElementHours(elementWithHours))))
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
        toast.error('No se pudo añadir el elemento')
      }
    },
    [id, dispatch, plannedItineraryHours]
  )

  const handleSpecialtyChange = useCallback(
    async (_: any, opt: Option | null) => {
      setSelectedSpecialty(opt)
      if (!opt) return
      await addElement(opt, 'training_action_id')
      setSelectedSpecialty(null)
    },
    [addElement]
  )

  const handleCertificationChange = useCallback(
    async (_: any, opt: Option | null) => {
      setSelectedCertification(opt)
      if (!opt) return
      await addElement(opt, 'certification_id')
      setSelectedCertification(null)
    },
    [addElement]
  )

  // Delete element
  const doDeleteElement = useCallback(
    async (elementId: number) => {
      try {
        const element = (Array.isArray(elements) ? elements : []).find(el => Number(el?.id) === Number(elementId))
        const elementHours = getElementHours(element)
        const response = await deleteTrainingContract_element(elementId)
        if (response?.status !== 200) {
          toast.error(response?.data?.message ?? 'No se pudo eliminar')

          return
        }
        toast.success('Elemento eliminado')
        dispatch(trainingContractActions.removeElement(elementId))
        dispatch(trainingContractActions.setHours(Math.max(0, safeNum(plannedItineraryHours) - elementHours)))
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
        toast.error('No se pudo eliminar')
      }
    },
    [dispatch, elements, plannedItineraryHours]
  )

  const askDeleteElement = useCallback(
    (elementId: number) => {
      openConfirm({
        title: '¿Eliminar elemento?',
        description: 'No podrás deshacer esta acción.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => doDeleteElement(elementId)
      })
    },
    [openConfirm, doDeleteElement]
  )

  // Order elements
  const handleListChange = useCallback((newList: ElementRow[]) => {
    if (!newList || newList.some(x => x == null)) return
    const mutable = newList.map(x => ({ ...x }))
    setSortedList(mutable)
    sortedListRef.current = mutable
  }, [])

  const handleDragEnd = useCallback(async () => {
    const latest = sortedListRef.current
    if (!latest || latest.length === 0) return

    setIsOrdering(true)
    try {
      const formData = new FormData()
      formData.append('elementListChange', JSON.stringify(latest))
      const response = await orderElements(formData)

      if (response?.status !== 200) {
        toast.error('No se pudo actualizar el orden')

        return
      }
      dispatch(trainingContractActions.updateElementOrder(latest))
    } catch (e) {
      handleErrorRef.current(e, logoutRef.current)
      toast.error('No se pudo actualizar el orden')
    } finally {
      setIsOrdering(false)
    }
  }, [dispatch])

  useEffect(() => {
    let idToast: string | null = null
    if (isOrdering) idToast = toast.loading('Actualizando Itinerario...')

    return () => {
      if (idToast) toast.dismiss(idToast)
    }
  }, [isOrdering])

  // Register/open course
  const doRegisterElement = useCallback(
    async (elementId: number) => {
      try {
        const response = await register(elementId)
        if (response?.status !== 200) {
          toast.error(response?.data?.message ?? 'No se pudo crear')

          return
        }
        toast.success('Curso creado')
        const element = response.data?.data?.element ?? response.data?.element
        dispatch(trainingContractActions.replaceElement(element))
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
        toast.error('No se pudo crear')
      }
    },
    [dispatch]
  )

  const handleRegisterElement = useCallback(
    (elementId: number) => {
      openConfirm({
        title: '¿Crear curso?',
        description: 'Se creará el curso para este elemento.',
        confirmText: 'Crear',
        cancelText: 'Cancelar',
        onConfirm: () => doRegisterElement(elementId)
      })
    },
    [openConfirm, doRegisterElement]
  )

  const handleOpenCourseModal = useCallback(
    (courseId: number) => {
      dispatch(courseActions.setId(courseId))
      dispatch(courseActions.openModal('info'))
    },
    [dispatch]
  )

  // ✅ abrir diálogos externos (fechas / tutor)
  const handleEditDate = useCallback((elementId: number) => {
    const el = (sortedListRef.current ?? []).find(e => Number(e?.id) === Number(elementId)) ?? null
    if (!el) return
    setEditDates({ open: true, element: el })
  }, [])

  const handleEditTutor = useCallback((element: ElementRow) => {
    if (!element) return
    setEditTutor({ open: true, element })
  }, [])

  const onSavedDates = useCallback(async () => {
    await loadFormation()
  }, [loadFormation])

  const onSavedTutor = useCallback(async () => {
    await loadFormation()
  }, [loadFormation])

  // Exams/Tutorials
  const openExamModal = useCallback(() => {
    dispatch(examTutorialActions.changeModalStatus())
    dispatch(examTutorialActions.setModalStatus('create'))
  }, [dispatch])

  const handleRowClicked = useCallback(
    (row: any) => {
      dispatch(examTutorialActions.setExamTutorialId(row.id))
      dispatch(examTutorialActions.changeModalStatus())
      dispatch(examTutorialActions.setModalStatus('info'))
    },
    [dispatch]
  )

  const doDeleteExamTutorial = useCallback(
    async (examId: number) => {
      try {
        const response = await deleteExamTutorial(examId)
        if (response?.status !== 200) {
          toast.error(response?.data?.message ?? 'No se pudo eliminar')

          return
        }
        toast.success('Eliminado con éxito')
        dispatch(examTutorialActions.removeExamTutorialFromList(examId))
        dispatch(examTutorialActions.setExamTutorialId(null))
      } catch (e) {
        handleErrorRef.current(e, logoutRef.current)
        toast.error('No se pudo eliminar')
      }
    },
    [dispatch]
  )

  const handleDeleteExamTutorial = useCallback(
    (examId: number) => {
      openConfirm({
        title: '¿Eliminar examen/tutoría?',
        description: 'No podrás deshacer esta acción.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        onConfirm: () => doDeleteExamTutorial(examId)
      })
    },
    [openConfirm, doDeleteExamTutorial]
  )

  // ✅ DataGrid columns para exámenes/tutorías
  const examColumns = useMemo(
    () => [
      {
        flex: 0.16,
        minWidth: 140,
        field: 'type',
        headerName: 'TIPO',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => <Typography variant='body2'>{p.row?.type ?? ''}</Typography>
      },
      {
        flex: 0.26,
        minWidth: 220,
        field: 'center',
        headerName: 'CENTRO',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2' sx={{ fontWeight: 700 }}>
            {p.row?.center ?? p.row?.center_name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.16,
        minWidth: 140,
        field: 'date',
        headerName: 'FECHA',
        headerAlign: 'center',
        align: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography variant='body2'>{p.row?.date ? dayjs(p.row.date).format('DD-MM-YYYY') : ''}</Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 180,
        field: 'time',
        headerName: 'HORARIO',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: (p: GridRenderCellParams) => (
          <Typography variant='body2'>{(p.row?.beginning ?? '') + ' - ' + (p.row?.end ?? '')}</Typography>
        )
      },
      {
        flex: 0.26,
        minWidth: 240,
        field: 'training_action',
        headerName: 'ACCIÓN FORMATIVA',
        headerAlign: 'center',
        renderCell: (p: GridRenderCellParams) => (
          <Typography noWrap variant='body2'>
            {p.row?.training_action ?? p.row?.training_action_name ?? ''}
          </Typography>
        )
      },
      {
        flex: 0.18,
        minWidth: 150,
        field: 'actions',
        headerName: 'ACCIONES',
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (p: GridRenderCellParams) => {
          const row = p.row
          const rid = row?.id

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%' }}>
              <Tooltip title='Ver' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    if (!rid) return
                    handleRowClicked(row)
                  }}
                >
                  <Icon icon='tabler:eye' fontSize={20} />
                </IconButton>
              </Tooltip>

              <Tooltip title='Eliminar' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation()
                    if (!rid) return
                    handleDeleteExamTutorial(Number(rid))
                  }}
                  disabled={disabledAll}
                >
                  <Icon icon='tabler:trash' fontSize={20} />
                </IconButton>
              </Tooltip>
            </Box>
          )
        }
      }
    ],
    [disabledAll, handleDeleteExamTutorial, handleRowClicked]
  )

  return (
    <Fragment>
      {/* ✅ Dialog de confirmación genérico */}
      <Dialog
        open={confirm.open}
        onClose={confirm.loading ? undefined : closeConfirm}
        data-backdrop-confirm={confirm.loading ? 'off' : undefined}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>{confirm.title}</DialogTitle>
        {confirm.description ? <DialogContent>{confirm.description}</DialogContent> : null}
        <DialogActions>
          <Button onClick={closeConfirm} disabled={Boolean(confirm.loading)}>
            {confirm.cancelText ?? 'Cancelar'}
          </Button>
          <Button variant='contained' onClick={runConfirm} disabled={Boolean(confirm.loading)}>
            {confirm.loading ? '...' : confirm.confirmText ?? 'Aceptar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ NUEVOS DIALOGS EXTERNOS */}
      <EditElementDatesDialog
        open={editDates.open}
        element={editDates.element}
        onClose={() => setEditDates({ open: false, element: null })}
        onSaved={onSavedDates}
      />

      <EditTutorDialog
        open={editTutor.open}
        element={editTutor.element}
        onClose={() => setEditTutor({ open: false, element: null })}
        onSaved={onSavedTutor}
      />

      {/* ✅ Dialog examen/tutoría: abre/cierra desde Redux */}
      <ExamTutorialDialog />

      {/* 1) CALCULAR ITINERARIO */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4} alignItems='center'>
            <Grid item xs={12} md={3}>
              <Typography fontWeight={700}>Horas de formación planificadas</Typography>
              <CustomTextField fullWidth value={formationPlannedTotal ?? ''} type='number' disabled />
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography fontWeight={700}>Horas diarias del primer año</Typography>
              <CustomTextField fullWidth value={dailyHours1 ?? ''} type='number' disabled />
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography fontWeight={700}>Horas diarias del segundo año</Typography>
              <CustomTextField fullWidth value={dailyHours2 ?? ''} type='number' disabled />
            </Grid>

            <Grid item xs={12} md={3}>
              <Typography fontWeight={700}>Días Totales</Typography>
              <CustomTextField fullWidth value={totalDays ?? ''} type='number' disabled />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant='contained'
                onClick={handleCalculate}
                disabled={!id || loadingCalc || disabledAll}
                startIcon={<Icon icon='tabler:calculator' />}
              >
                {loadingCalc ? 'Calculando...' : 'Calcular Itinerario'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 2) RESUMEN HORAS */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography fontWeight={700}>Horas bonificables totales</Typography>
              <CustomTextField fullWidth value={bonificables} type='number' disabled />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography fontWeight={700}>Horas planificadas en el itinerario</Typography>
              <CustomTextField fullWidth value={plannedItineraryHours ?? ''} type='number' disabled />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography fontWeight={700}>{exceeded > 0 ? 'Horas excedidas' : 'Horas restantes'}</Typography>
              <CustomTextField fullWidth value={exceeded > 0 ? exceeded : remaining} type='number' disabled />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 3) SELECTORS */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          {selectedContract ? (
            <Grid container spacing={4}>
              {Number(selectedContract?.specialty) === 1 ? (
                <Fragment>
                  <Grid item xs={12} md={4} sx={{ zIndex: 4 }}>
                    <Typography sx={{ color: 'primary.main', mb: 2 }}>Familia profesional</Typography>
                    <Autocomplete
                      value={selectedProfessionalFamily}
                      onChange={(_, value) => setSelectedProfessionalFamily(value)}
                      options={professionalFamilies}
                      getOptionLabel={o => o?.label ?? ''}
                      isOptionEqualToValue={(o, v) => Number(o?.value) === Number(v?.value)}
                      disabled={disabledAll}
                      renderInput={params => <CustomTextField {...params} placeholder='Todas...' />}
                    />
                  </Grid>

                  <Grid item xs={12} md={8} sx={{ zIndex: 3 }}>
                    <Typography sx={{ color: 'primary.main', mb: 2 }}>Especialidades</Typography>
                    <Autocomplete
                      value={selectedSpecialty}
                      onChange={handleSpecialtyChange}
                      options={filteredSpecialties}
                      getOptionLabel={o => o?.label ?? ''}
                      isOptionEqualToValue={(o, v) => Number(o?.value) === Number(v?.value)}
                      disabled={disabledAll}
                      renderOption={(props, option) => (
                        <Box component='li' {...props} sx={{ fontWeight: isHighlightedCourseOrigin(option) ? 700 : 400 }}>
                          {option?.label ?? ''}
                        </Box>
                      )}
                      renderInput={params => <CustomTextField {...params} placeholder='Selecciona...' />}
                    />
                  </Grid>
                </Fragment>
              ) : null}

              {Number(selectedContract?.professional_certificate) === 1 ? (
                <Grid item xs={12} md={6} sx={{ zIndex: 2 }}>
                  <Typography sx={{ color: 'primary.main', mb: 2 }}>Certificados</Typography>
                  <Autocomplete
                    value={selectedCertification}
                    onChange={handleCertificationChange}
                    options={filteredCertifications}
                    getOptionLabel={o => o?.label ?? ''}
                    isOptionEqualToValue={(o, v) => Number(o?.value) === Number(v?.value)}
                    disabled={disabledAll}
                    renderOption={(props, option) => (
                      <Box component='li' {...props} sx={{ fontWeight: isHighlightedCourseOrigin(option) ? 700 : 400 }}>
                        {option?.label ?? ''}
                      </Box>
                    )}
                    renderInput={params => <CustomTextField {...params} placeholder='Selecciona...' />}
                  />
                </Grid>
              ) : null}
            </Grid>
          ) : null}
        </CardContent>
      </Card>

      {/* 4) LISTA ELEMENTOS */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'primary.main' }}>Especialidades / Certificados</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography sx={{ color: 'primary.main' }}>Presencial</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography sx={{ color: 'primary.main' }}>Teleformación</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography sx={{ color: 'primary.main' }}>Fechas</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography sx={{ color: 'primary.main' }}>Acciones</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <ReactSortable
            list={sortedList ?? []}
            setList={handleListChange}
            group='handleList'
            handle='.drag-handle'
            onEnd={handleDragEnd}
            style={{ paddingLeft: 0, margin: 0 }}
          >
            {(sortedList ?? []).map(element => {
              const name =
                element?.training_action_id != null ? element?.training_action_name : element?.certification_name ?? ''

              const isCertification = element?.certification_id != null
              const f2f = isCertification
                ? element?.certification_face_to_face_hours ?? 0
                : element?.training_action_face_to_face_hours ?? 0
              const tele = isCertification
                ? element?.certification_teletraining_hours ?? 0
                : element?.training_action_teletraining_hours ?? 0

              const dateText =
                element?.beginning && element?.end
                  ? `${dayjs(element.beginning).format('DD-MM-YYYY')} - ${dayjs(element.end).format('DD-MM-YYYY')}`
                  : ''

              const boldName = isHighlightedCourseOrigin(element)

              return (
                <Box
                  key={element?.id}
                  sx={{
                    listStyle: 'none',
                    py: 2,
                    borderBottom: theme => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item xs={12} md={4}>
                      <Typography fontWeight={boldName ? 700 : 400}>{name}</Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography>Presencial: {f2f}</Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography>Teleformación: {tele}</Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Typography variant='body2' color='text.secondary'>
                        {dateText}
                      </Typography>
                    </Grid>

                    {/* ✅ Acciones: (drag + calendar + edit tutor + plus/eye + trash + lock) */}
                    <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton className='drag-handle' size='small' title='Mover'>
                        <Icon icon='tabler:menu-2' />
                      </IconButton>

                      <IconButton
                        size='small'
                        title='Editar fechas'
                        onClick={() => handleEditDate(element.id)}
                        disabled={disabledAll}
                      >
                        <Icon icon='tabler:calendar' />
                      </IconButton>

                      <IconButton
                        size='small'
                        title='Editar tutor'
                        onClick={() => handleEditTutor(element)}
                        disabled={disabledAll}
                      >
                        <Icon icon='tabler:edit' />
                      </IconButton>

                      {element?.course_id == null && element?.beginning && element?.end ? (
                        <IconButton
                          size='small'
                          title='Crear curso'
                          onClick={() => handleRegisterElement(element.id)}
                          disabled={disabledAll}
                        >
                          <Icon icon='tabler:square-plus' />
                        </IconButton>
                      ) : null}

                      {element?.course_id != null ? (
                        <IconButton
                          size='small'
                          title='Ver curso'
                          onClick={() => handleOpenCourseModal(element.course_id)}
                        >
                          <Icon icon='tabler:eye' />
                        </IconButton>
                      ) : null}

                      <IconButton
                        size='small'
                        title='Eliminar'
                        onClick={() => askDeleteElement(element.id)}
                        disabled={disabledAll}
                      >
                        <Icon icon='tabler:trash' />
                      </IconButton>

                      {isOnLeaveDateInRange() ? (
                        <IconButton size='small' title='Bloqueado por baja' disabled>
                          <Icon icon='tabler:lock' />
                        </IconButton>
                      ) : null}
                    </Grid>
                  </Grid>
                </Box>
              )
            })}
          </ReactSortable>
        </CardContent>
      </Card>

      {/* 5) EXÁMENES / TUTORÍAS */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button variant='contained' onClick={openExamModal} disabled={disabledAll}>
            Crear Examen/Tutoría
          </Button>
        </CardContent>
      </Card>

      {/* ✅ TABLA (DataGrid) EXÁMENES / TUTORÍAS */}
      <Card sx={{ mb: 6 }}>
        <CardContent>
          {Array.isArray(examsTutorials) && examsTutorials.length > 0 ? (
            <Box sx={{ height: 420, width: '100%' }}>
              <DataGrid
                disableColumnFilter
                disableRowSelectionOnClick
                rows={examsTutorials}
                columns={examColumns as any}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                onRowClick={p => handleRowClicked(p.row)}
                getRowId={row => row.id}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant='h5' sx={{ mb: 2 }}>
                No hay exámenes ni tutorías creadas
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Por favor, añade algunos exámenes o tutorías para verlos aquí.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fragment>
  )
}

export default TrainingContractFormationTab
