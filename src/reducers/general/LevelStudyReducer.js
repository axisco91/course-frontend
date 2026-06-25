import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

// Reducer donde se guarda los generos
const levelStudySlice = createSlice({
  name: 'levelStudy',
  initialState: {
    id: null,
    showEliminateDialog: false,
    levelStudies: [],
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
    setLevelStudies(state, action) {
      state.levelStudies = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
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

export const levelStudyActions = levelStudySlice.actions

export default levelStudySlice.reducer
