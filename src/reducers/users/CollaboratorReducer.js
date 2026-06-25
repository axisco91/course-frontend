import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de los usuarios
const collaboratorSlice = createSlice({
  name: 'collaborator',
  initialState: {
    id: null,
    collaborators: []
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },

    // Asignamos los usuarios
    setCollaborators(state, action) {
      state.collaborators = action.payload
    }
  }
})

export const collaboratorActions = collaboratorSlice.actions

export default collaboratorSlice.reducer
