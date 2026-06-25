import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: '',
  surname: '',
  dni: '',
  telephone: '',
  email: '',
  area: '',
  show_inactive: false
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  teachers: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const teacherSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setTeachers(state, action) {
      state.teachers = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.teacherId !== undefined) {
        state.id = action.payload.teacherId
      }
    },
    closeTeacherModal(state) {
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

export const teacherActions = teacherSlice.actions
export default teacherSlice.reducer
