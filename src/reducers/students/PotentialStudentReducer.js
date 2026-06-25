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
  potentialStudents: [],
  dniExist: false,
  studentSuccess: false,
  studentPrivateSuccess: false,
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view', // 'view' | 'edit' | 'create'
  showSendEmailModal: false,
  showSendBonusEmailModal: false
}

const potentialStudentSlice = createSlice({
  name: 'potentialStudents',
  initialState,
  reducers: {
    // DATA
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setPotentialStudents(state, action) {
      state.potentialStudents = action.payload
    },
    setDniExist(state, action) {
      state.dniExist = action.payload
    },
    setStudentPrivateSuccess(state, action) {
      state.studentPrivateSuccess = action.payload
    },
    setStudentSuccess(state, action) {
      state.studentSuccess = action.payload
    },

    // MODAL
    openModal(state, action) {
      const { mode, studentId } = action.payload || {}
      state.modalOpen = true
      state.modalMode = mode || 'view'

      // ✅ CLAVE: solo pisa el id si viene uno
      if (studentId !== undefined && studentId !== null) {
        state.id = studentId
      }
    },

    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },
    changeSendEmailModalStatus(state) {
      state.showSendEmailModal = !state.showSendEmailModal
    },
    changeSendBonusEmailModalStatus(state) {
      state.showSendBonusEmailModal = !state.showSendBonusEmailModal
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

export const potentialStudentActions = potentialStudentSlice.actions
export default potentialStudentSlice.reducer
