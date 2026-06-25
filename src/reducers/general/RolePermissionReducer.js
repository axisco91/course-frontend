import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de los idiomas
const rolePermissionSlice = createSlice({
  name: 'rolePermission',
  initialState: {
    id: null,
    rolePermissions: []
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },

    // Asignamos los roles
    setRolePermissions(state, action) {
      state.rolePermissions = action.payload
    },

    // Modificamos un role en el array
    replaceRolePermission(state, action) {
      const updatedRolePermission = action.payload
      const index = state.rolePermissions.findIndex(rolePermission => rolePermission.id === updatedRolePermission.id)
      if (index !== -1) {
        state.rolePermissions[index] = updatedRolePermission
      }
    },
    updateRolePermissionById(state, action) {
      const { permissionId, rolePermission } = action.payload
      const index = state.rolePermissions.findIndex(rolePermission => rolePermission.id === permissionId)

      if (index !== -1) {
        state.rolePermissions[index].permission_id = permissionId
        state.rolePermissions[index].role_has_permission = rolePermission
      }
    }
  }
})

export const rolePermissionActions = rolePermissionSlice.actions

export default rolePermissionSlice.reducer
