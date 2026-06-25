import { createSlice } from '@reduxjs/toolkit'

const initialFilters = {
  name: ''
}

const initialState = {
  id: null,
    showEliminateDialog: false,
  documents: [],
  selectedDocument: null,
  filters: initialFilters,
  appliedFilters: initialFilters,

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setDocuments(state, action) {
      state.documents = action.payload
    },
    setSelectedDocument(state, action) {
      state.selectedDocument = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload?.mode ?? 'view'

      const modalId = action.payload?.documentId
      if (modalId !== undefined) {
        state.id = modalId
      }
    },
    closeModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
      state.selectedDocument = null
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

export const documentActions = documentSlice.actions
export default documentSlice.reducer
