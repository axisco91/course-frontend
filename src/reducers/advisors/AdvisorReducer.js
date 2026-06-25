import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: '',
  nif: '',
  type: null, // company_type_id
  activity: null, // company_activity_id
  province: null, // province_id
  show_inactive: false // checkbox "Mostrar Inactivo"
}

// Reducer donde se guarda los datos de las empresas
const advisorSlice = createSlice({
  name: 'advisor',
  initialState: {
    id: null,
    showEliminateDialog: false,
    advisors: [],
    filters: initialFilters,
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view' // 'view' | 'edit' | 'create'
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setAdvisors(state, action) {
      state.advisors = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeAdvisorModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },

    // ✅ filtros draft
    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },

    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },

    // ✅ aplicar filtros
    applyFilters(state) {
      state.appliedFilters = { ...state.filters }
    },

    resetFilters(state) {
      state.filters = { ...initialFilters }
      state.appliedFilters = { ...initialFilters }
    }
  }
})

export const advisorActions = advisorSlice.actions

export default advisorSlice.reducer
