import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  name: '',
  email: '',
  active: ''
}

// Reducer donde se guarda los datos de los usuarios
const userSlice = createSlice({
  name: 'user',
  initialState: {
    id: null,
    showEliminateDialog: false,
    users: [],
    user: null,

    // =========
    // FILTERS
    // =========
    filters: initialFilters,
    appliedFilters: initialFilters,

    // =========
    // UI MODAL
    // =========
    modalOpen: false,
    modalMode: 'view',
    modalStatus: 'info',

    // ✅ compat con tu antiguo código que usaba showModal
    showModal: false
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },

    // Asignamos los usuarios
    setUsers(state, action) {
      state.users = action.payload
    },

    // Asignamos los usuarios
    setUser(state, action) {
      state.user = action.payload
    },

    // =================
    // MODAL
    // =================
    openModal(state, action) {
      state.modalOpen = true
      state.showModal = true

      state.modalMode = action.payload.mode

      // mapeo automático
      state.modalStatus = action.payload.mode === 'create' ? 'create' : action.payload.mode === 'edit' ? 'edit' : 'info'

      if (action.payload.examTutorialId !== undefined) {
        state.id = action.payload.examTutorialId
      }
    },

    closeUserModal(state) {
      state.modalOpen = false
      state.showModal = false
      state.modalMode = 'view'
      state.modalStatus = 'info'
      state.id = null
    },

    // =================
    // FILTERS
    // =================
    setFilter(state, action) {
      const { key, value } = action.payload
      state.filters[key] = value
    },

    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
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

export const userActions = userSlice.actions

export default userSlice.reducer
