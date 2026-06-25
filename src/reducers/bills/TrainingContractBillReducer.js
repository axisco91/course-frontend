import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  student: null,
  company: null,
  month: null,
  invoiced: null,
  paid: null,
  year: null
}

// Reducer donde se guarda los datos de las empresas
const trainingContractBillSlice = createSlice({
  name: 'trainingContractBill',
  initialState: {
    id: null,
    trainingContractBills: [],
    filters: initialFilters,
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view', // 'view' | 'edit' | 'create'
    showEliminateDialog: false
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setTrainingContractBills(state, action) {
      state.trainingContractBills = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeTrainingContractBillModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
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

export const trainingContractBillActions = trainingContractBillSlice.actions

export default trainingContractBillSlice.reducer
