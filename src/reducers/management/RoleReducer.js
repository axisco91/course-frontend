import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los roles
const roleSlice = createSlice({
  name: 'role',
  initialState: {
    id: null,
    showEliminateDialog: false,
    roles: null,
    role: null
  },
  reducers: {
    setRoles(state, action) {
      state.roles = action.payload
    },
    setRole(state, action) {
      state.role = action.payload
    },
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    }
  }
})

export const roleActions = roleSlice.actions

export default roleSlice.reducer
