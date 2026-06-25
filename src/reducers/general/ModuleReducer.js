import { createSlice } from '@reduxjs/toolkit'

export const initialFilters = {
  code: '',
  name: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  name: '',
  modules: [],
  filters: initialFilters,
  appliedFilters: initialFilters,
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setName(state, action) {
      state.name = action.payload ?? ''
    },
    setModules(state, action) {
      state.modules = Array.isArray(action.payload) ? action.payload : []
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.moduleId !== undefined) {
        state.id = action.payload.moduleId
      }
      if (action.payload.moduleName !== undefined) {
        state.name = action.payload.moduleName ?? ''
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.name = ''
    },
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

export const moduleActions = moduleSlice.actions

export default moduleSlice.reducer
