import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los permissions
const permissionSlice = createSlice({
  name: 'permission',
  initialState: {
    id: null,
    showEliminateDialog: false,
    permissions: null,
    permission: null,
    searchText: ''
  },
  reducers: {
    setPermissions(state, action) {
      state.permissions = action.payload
    },
    setPermission(state, action) {
      state.permission = action.payload
    },
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setSearchText(state, action) {
      state.searchText = action.payload
    }
  }
})

export const permissionActions = permissionSlice.actions

export default permissionSlice.reducer
