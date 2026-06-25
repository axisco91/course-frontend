import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  course: null,
  company: null,
  student: null,
  status: null,
  type: null,
  beginning: '',
  end: ''
}

const choreSlice = createSlice({
  name: 'chore',
  initialState: {
    id: null,
    showEliminateDialog: false,
    chores: [],

    // ✅ filtros de la tabla
    filters: initialFilters, // draft (form)
    appliedFilters: initialFilters,

    // UI modal
    modalOpen: false,
    modalMode: 'view' // 'view' | 'edit' | 'create'
  },
  reducers: {
    // -------------------------
    // Básicos
    // -------------------------
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },

    setChores(state, action) {
      state.chores = action.payload
    },

    // -------------------------
    // Modal
    // -------------------------
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },

    closeChoreModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },

    // -------------------------
    // ✅ Filtros
    // -------------------------
    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },

    setFilters(state, action) {
      state.filters = {
        ...state.filters,
        ...action.payload
      }
    },
    applyFilters(state) {
      state.appliedFilters = { ...state.filters }
    },
    resetFilters(state) {
      state.filters = { ...initialFilters }
      state.appliedFilters = { ...initialFilters }
    }
  }
})

export const choreActions = choreSlice.actions
export default choreSlice.reducer
