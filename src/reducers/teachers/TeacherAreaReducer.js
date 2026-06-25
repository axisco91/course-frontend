import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  teacherAreas: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const teacherAreaSlice = createSlice({
  name: 'teacherAreas',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTeacherAreas(state, action) {
      state.teacherAreas = action.payload
    },
    openModal(state, action) {
      const { mode, Id } = action.payload || {}
      state.modalOpen = true
      state.modalMode = mode || 'view'
      state.id = Id ?? null
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

export const teacherAreaActions = teacherAreaSlice.actions
export default teacherAreaSlice.reducer
