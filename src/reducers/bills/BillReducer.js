import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  course: null,
  course_text: '',
  company: null,
  type: null,
  invoiced: null,
  paid: null,
    showEliminateDialog: false,
  year: null
}

// Reducer donde se guarda los datos de las empresas
const billSlice = createSlice({
  name: 'bill',
  initialState: {
    id: null,
    bills: [],
    filters: initialFilters,
    appliedFilters: initialFilters,
    showTable: true,

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
    setBills(state, action) {
      state.bills = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeBillModal(state) {
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
    },
    setShowTable(state, action) {
      state.showTable = action.payload
    }
  }
})

export const billActions = billSlice.actions

export default billSlice.reducer
