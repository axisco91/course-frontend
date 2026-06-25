import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  series: '',
  description: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  trainingContractSeries: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const trainingContractSerieSlice = createSlice({
  name: 'trainingContractSerie',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTrainingContractSeries(state, action) {
      state.trainingContractSeries = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.trainingContractSerieId ?? action.payload?.serieId
      if (modalId !== undefined) {
        state.id = modalId
      }
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

export const trainingContractSerieActions = trainingContractSerieSlice.actions
export default trainingContractSerieSlice.reducer
