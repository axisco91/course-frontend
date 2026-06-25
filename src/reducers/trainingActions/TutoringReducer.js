import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: ''
}

// Reducer donde se guarda los datos de las empresas
const tutoringSlice = createSlice({
  name: 'tutoring',
  initialState: {
    id: null,
    showEliminateDialog: false,
    tutorings: null,
    filters: initialFilters,
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view'
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTutorings(state, action) {
      state.tutorings = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.trainingActionId !== undefined) {
        state.id = action.payload.trainingActionId
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

export const tutoringActions = tutoringSlice.actions

export default tutoringSlice.reducer
