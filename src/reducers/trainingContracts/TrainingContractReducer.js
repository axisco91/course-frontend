import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  company: null,
  student: null,
  status: null
}

const initialState = {
  // ====== Base ======
  id: null,
    showEliminateDialog: false,
  trainingContracts: [],
  trainingContract: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view', // 'view' | 'edit' | 'create'

  // ====== NUEVO: formation tab data ======
  totalFormationHours: 0, // horas planificadas (planned hours)
  totalHours: 0, // horas bonificables totales
  remainingHours: 0, // (si >0: excedidas, si <0: restantes) -> como tu lógica antigua

  formativeHoursFirstYear: 0,
  formativeHoursSecondYear: 0,
  dailyHours1: 0,
  dailyHours2: 0,
  totalDays: 0,

  // select options
  specialties: [], // [{ value, label, total_hours, course_origin_id }]
  certifications: [], // [{ value, label, total_hours, ... }]

  // elements list (itinerary)
  elements: [],

  // UI flags / modal element
  hoursCalculated: false,
  showElementModal: false,
  elementId: null,
  hours: 0,
  totalAmount: 0,
  totalCalculatedHours: 0
}

const trainingContractSlice = createSlice({
  name: 'trainingContracts',
  initialState,
  reducers: {
    // ====== Base ======
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTrainingContracts(state, action) {
      state.trainingContracts = action.payload
    },
    setTrainingContract(state, action) {
      state.trainingContract = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.trainingContractId !== undefined) {
        state.id = action.payload.trainingContractId
      }
    },
    closeTrainingContractModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },

    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    applyFilters(state) {
      state.appliedFilters = { ...state.filters }
    },
    resetFilters(state) {
      state.filters = { ...initialFilters }
      state.appliedFilters = { ...initialFilters }
    },

    // ====== NUEVO: hours / totals ======
    setFormationHours(state, action) {
      state.totalHours = action.payload ?? 0
    },
    setTotalFormationHours(state, action) {
      state.totalFormationHours = action.payload ?? 0
    },
    setRemainingHours(state, action) {
      state.remainingHours = action.payload ?? 0
    },

    setFormativeHoursFirstYear(state, action) {
      state.formativeHoursFirstYear = action.payload ?? 0
    },
    setFormativeHoursSecondYear(state, action) {
      state.formativeHoursSecondYear = action.payload ?? 0
    },
    setDailyHours1(state, action) {
      state.dailyHours1 = action.payload ?? 0
    },
    setDailyHours2(state, action) {
      state.dailyHours2 = action.payload ?? 0
    },
    setTotalDays(state, action) {
      state.totalDays = action.payload ?? 0
    },
    setHours(state, action) {
      state.hours = action.payload ?? 0
    },

    // ====== NUEVO: specialties / certifications options ======
    setSpecialties(state, action) {
      state.specialties = Array.isArray(action.payload) ? action.payload : []
    },
    addSpecialties(state, action) {
      // admite 1 opción o array
      const items = Array.isArray(action.payload) ? action.payload : [action.payload]
      items.forEach(opt => {
        if (!opt) return
        const exists = state.specialties.some(o => Number(o.value) === Number(opt.value))
        if (!exists) state.specialties.push(opt)
      })
    },
    removeSpecialty(state, action) {
      const id = action.payload
      state.specialties = (state.specialties || []).filter(o => Number(o.value) !== Number(id))
    },

    setCertifications(state, action) {
      state.certifications = Array.isArray(action.payload) ? action.payload : []
    },
    addCertifications(state, action) {
      const items = Array.isArray(action.payload) ? action.payload : [action.payload]
      items.forEach(opt => {
        if (!opt) return
        const exists = state.certifications.some(o => Number(o.value) === Number(opt.value))
        if (!exists) state.certifications.push(opt)
      })
    },
    removeCertification(state, action) {
      const id = action.payload
      state.certifications = (state.certifications || []).filter(o => Number(o.value) !== Number(id))
    },

    // ====== NUEVO: elements (itinerary) ======
    setElements(state, action) {
      state.elements = Array.isArray(action.payload) ? action.payload : []
    },
    addElement(state, action) {
      if (!action.payload) return
      state.elements = Array.isArray(state.elements) ? state.elements : []
      state.elements.push(action.payload)
    },
    removeElement(state, action) {
      const id = action.payload
      state.elements = (state.elements || []).filter(el => Number(el?.id) !== Number(id))
    },
    replaceElement(state, action) {
      const el = action.payload
      if (!el?.id) return
      state.elements = (state.elements || []).map(x => (Number(x?.id) === Number(el.id) ? el : x))
    },
    updateElementDates(state, action) {
      const { id, beginning, end } = action.payload || {}
      state.elements = (state.elements || []).map(el =>
        Number(el?.id) === Number(id) ? { ...el, beginning, end } : el
      )
    },
    updateElementOrder(state, action) {
      // recibe lista ya ordenada
      state.elements = Array.isArray(action.payload) ? action.payload : state.elements
    },

    // ====== NUEVO: sumar/restar horas ======
    addHours(state, action) {
      const n = Number(action.payload ?? 0)
      if (Number.isFinite(n)) state.totalFormationHours = Number(state.totalFormationHours ?? 0) + n
    },
    restHours(state, action) {
      const n = Number(action.payload ?? 0)
      if (Number.isFinite(n)) state.totalFormationHours = Number(state.totalFormationHours ?? 0) - n
    },

    // ====== NUEVO: flags + modal element ======
    setCalculatedHours(state, action) {
      state.hoursCalculated = Boolean(action.payload)
    },
    changeElementModalStatus(state) {
      state.showElementModal = !state.showElementModal
    },
    setElementId(state, action) {
      state.elementId = action.payload
    },
    setTotalAmount(state, action) {
      state.totalAmount = action.payload
    },
    setTotalCalculatedHours(state, action) {
      state.totalCalculatedHours = action.payload
    },

    // (opcional) reset de todo lo “nuevo” cuando cierres modal
    resetFormationState(state) {
      state.totalFormationHours = 0
      state.totalHours = 0
      state.remainingHours = 0
      state.formativeHoursFirstYear = 0
      state.formativeHoursSecondYear = 0
      state.dailyHours1 = 0
      state.dailyHours2 = 0
      state.totalDays = 0
      state.specialties = []
      state.certifications = []
      state.elements = []
      state.hoursCalculated = false
      state.showElementModal = false
      state.elementId = null
    }
  }
})

export const trainingContractActions = trainingContractSlice.actions
export default trainingContractSlice.reducer
