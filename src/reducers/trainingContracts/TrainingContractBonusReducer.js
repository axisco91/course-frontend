import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

const initialState = {
  id: null,
  trainingContractBonuses: [],
  selectedTrainingContractBonus: null,
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view', // 'view' | 'edit' | 'create'
  showEliminateDialog: false
}

const trainingContractBonusSlice = createSlice({
  name: 'trainingContractBonus',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setTrainingContractsBonuses(state, action) {
      state.trainingContractBonuses = action.payload
    },
    setSelectedTrainingContractBonus(state, action) {
      state.selectedTrainingContractBonus = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.trainingContractBonus !== undefined) {
        state.selectedTrainingContractBonus = action.payload.trainingContractBonus
      }
      if (action.payload.trainingContractBonusId !== undefined) {
        state.id = action.payload.trainingContractBonusId
      }
    },
    closeTrainingContractBonusModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.selectedTrainingContractBonus = null
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

export const trainingContractBonusActions = trainingContractBonusSlice.actions
export default trainingContractBonusSlice.reducer
