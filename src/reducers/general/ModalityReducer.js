import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

// Reducer donde se guarda los generos
const modalitySlice = createSlice({
  name: 'modality',
  initialState: {
    id: null,
    showEliminateDialog: false,
    modalities: null,
    filters: initialFilters,
    appliedFilters: initialFilters,
    modalOpen: false,
    modalMode: 'view'
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setModalities(state, action) {
      state.modalities = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.modalityId !== undefined) {
        state.id = action.payload.modalityId
      }
    },
    closeModal(state) {
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

export const modalityActions = modalitySlice.actions

export default modalitySlice.reducer
