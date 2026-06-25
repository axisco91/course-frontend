import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  centers: [],

  filters: initialFilters, // draft (form)
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const centerSlice = createSlice({
  name: 'centers',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setCenters(state, action) {
      state.centers = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.centerId !== undefined) {
        state.id = action.payload.centerId
      }
    },
    closeCenterModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    },
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

export const centerActions = centerSlice.actions
export default centerSlice.reducer
