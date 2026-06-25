import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: '',
  surname: '',
  dni: '',
  telephone: '',
  email: '',
  company_id: 0,
  show_inactive: false
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  students: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    // DATA
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setStudents(state, action) {
      state.students = action.payload
    },
    setCompanyId(state, action) {
      state.companyId = action.payload
    },

    // MODAL
    openStudentModal(state, action) {
      const { mode, studentId } = action.payload || {}
      state.modalOpen = true
      state.modalMode = mode || 'view'

      // ✅ CLAVE: solo pisa el id si viene uno
      if (studentId !== undefined && studentId !== null) {
        state.id = studentId
      }
    },

    closeStudentModal(state) {
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

export const studentActions = studentSlice.actions
export default studentSlice.reducer
