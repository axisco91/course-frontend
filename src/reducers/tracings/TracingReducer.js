import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  course: null, // id
  company: null, // id
  student: null, // id
  status: null, // id o name (según tu back)
  type: null, // id o name
  beginning: '', // 'YYYY-MM-DD'
  end: '' // 'YYYY-MM-DD'
}

// Reducer donde se guarda los datos de las empresas
const tracingSlice = createSlice({
  name: 'tracing',
  initialState: {
    id: null,
    showEliminateDialog: false,
    tracings: [],
    filters: initialFilters,
    appliedFilters: initialFilters,

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
    setTracings(state, action) {
      state.tracings = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.tracingId !== undefined) {
        state.id = action.payload.tracingId
      } else if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeTracingModal(state) {
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

export const tracingActions = tracingSlice.actions

export default tracingSlice.reducer
