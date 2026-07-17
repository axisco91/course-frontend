import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  formative_action: '',
  name: '',
  group: '',
  start_date: '',
  end_date: '',
  modality: null, // modality_id
  type: null, // course_type_id
  status: null, // course_status_id
  company: null // company_id
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  courses: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCourses(state, action) {
      state.courses = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeCourseModal(state) {
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

export const courseActions = courseSlice.actions
export default courseSlice.reducer
