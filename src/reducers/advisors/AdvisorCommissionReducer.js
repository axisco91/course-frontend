import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {}

// Reducer donde se guarda los datos de las empresas
const advisorCommissionSlice = createSlice({
  name: 'advisorCommission',
  initialState: {
    id: null,
    advisorCommissions: [],
    currentAdvisorCommission: null,
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
    setAdvisorCommissions(state, action) {
      state.advisorCommissions = action.payload
    },
    setCurrentAdvisorCommission(state, action) {
      state.currentAdvisorCommission = action.payload ?? null
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      const modalId = action.payload?.advisorCommissionId ?? action.payload?.courseId
      if (modalId !== undefined) {
        state.id = modalId
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.currentAdvisorCommission = null
    },
    closeAdvisorCommissionModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.currentAdvisorCommission = null
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

export const advisorCommissionActions = advisorCommissionSlice.actions

export default advisorCommissionSlice.reducer
