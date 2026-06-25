import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de los departamentos
const generalSlice = createSlice({
  name: 'general',
  initialState: {
    filterButtonClickCount: 0,
    showForm: false,
    showImportDialog: false,
    showCreateDialog: false,
    showCommentDialog: false,
    showPosponeDialog: false,
    showRejectDialog: false,
    showReopenDialog: false,
    showConfirmDialog: false,
    showLicenseDialog: false,
    showApplyDialog: false,
    zoom: false,
    homeCustomizations: [],
    legalTexts: ''
  },
  reducers: {
    addFilterButtonClickCount(state) {
      state.filterButtonClickCount += 1
    },
    setShowForm(state, action) {
      state.showForm = action.payload
    },
    setShowImportDialog(state, action) {
      state.showImportDialog = action.payload
    },
    setShowCreateDialog(state, action) {
      state.showCreateDialog = action.payload
    },
    setShowCommentDialog(state, action) {
      state.showCommentDialog = action.payload
    },
    setShowPosponeDialog(state, action) {
      state.showPosponeDialog = action.payload
    },
    setShowRejectDialog(state, action) {
      state.showRejectDialog = action.payload
    },
    setShowReopenDialog(state, action) {
      state.showReopenDialog = action.payload
    },
    setShowConfirmDialog(state, action) {
      state.showConfirmDialog = action.payload
    },
    setShowApplyDialog(state, action) {
      state.showApplyDialog = action.payload
    },
    setZoom(state, action) {
      state.zoom = action.payload
    },
    setHomeCustomizations(state, action) {
      state.homeCustomizations = action.payload
    },
    setLegalTexts(state, action) {
      state.legalTexts = action.payload
    }
  }
})

export const generalActions = generalSlice.actions

export default generalSlice.reducer
