import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de los idiomas
const userRoleSlice = createSlice({
  name: 'userRole',
  initialState: {
    id: null,
    userRoles: [],

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

    // Asignamos los idiomas
    setUserRoles(state, action) {
      state.userRoles = action.payload
    },

    // Asignamos la idioma
    setUserRole(state, action) {
      state.userRole = action.payload
    },

    // Modificamos un idioma en el array
    replaceUserRoles(state, action) {
      const updatedUserRole = action.payload
      const index = state.userRoles.findIndex(role => role.id === updatedUserRole.id)
      if (index !== -1) {
        state.userRoles[index] = updatedUserRole
      }
    },
    updateUserRoleById(state, action) {
      const { role_id } = action.payload
      const index = state.userRoles.findIndex(role => role.id === role_id)

      if (index !== -1) {
        state.userRoles[index].user_has_role = user_has_role
      }
    }
  }
})

export const userRoleActions = userRoleSlice.actions

export default userRoleSlice.reducer
