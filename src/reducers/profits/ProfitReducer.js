import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  course: null,
  company: null,
  status: null
}

// Reducer donde se guarda los datos de las empresas
const profitSlice = createSlice({
  name: 'profit',
  initialState: {
    id: null,
    showEliminateDialog: false,
    profits: [],
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
    setProfits(state, action) {
      state.profits = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeProfitModal(state) {
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

export const profitActions = profitSlice.actions

export default profitSlice.reducer
