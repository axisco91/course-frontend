import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  trainingContractStatuses: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const trainingContractStatusSlice = createSlice({
  name: 'trainingContractStatus',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTrainingContractsStatuses(state, action) {
      state.trainingContractStatuses = action.payload
    },
    setTrainingContractStatuses(state, action) {
      state.trainingContractStatuses = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'
      const modalId = action.payload?.trainingContractStatusId ?? action.payload?.id
      if (modalId !== undefined) {
        state.id = modalId
      }
    },
    closeTrainingContractStatusModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },
    closeModal(state) {
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

export const trainingContractStatusActions = trainingContractStatusSlice.actions
export default trainingContractStatusSlice.reducer
