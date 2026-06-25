import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  formative_action: '',
  name: '',
  professional_family: null,
  professional_area: null,
  modality: null,
  provider: null,
  course_origin: null,
  show_inactive: false
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  trainingActions: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const trainingActionSlice = createSlice({
  name: 'trainingActions',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTrainingActions(state, action) {
      state.trainingActions = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.trainingActionId !== undefined) {
        state.id = action.payload.trainingActionId
      }
    },
    closeTrainingActionModal(state) {
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

export const trainingActionActions = trainingActionSlice.actions
export default trainingActionSlice.reducer
