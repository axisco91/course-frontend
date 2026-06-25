import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  formative_action: '',
  name: '',
  group: '',
  type: null, // registration_type_id
  status: null, // registration_status_id
  company: null // company_id
}

const initialState = {
  id: null,
  registrations: [],
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view', // 'view' | 'edit' | 'create'
  showEliminateDialog: false
}

const registrationSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setRegistrations(state, action) {
      state.registrations = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.registrationId !== undefined) {
        state.id = action.payload.registrationId
      }
    },
    closeRegistrationModal(state) {
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
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    }
  }
})

export const registrationActions = registrationSlice.actions
export default registrationSlice.reducer
