import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de los idiomas
const userCommissionSlice = createSlice({
  name: 'userCommission',
  initialState: {
    id: null,
    userCommissions: [],
    userCommission: null,
    modalOpen: false,
    modalMode: 'view',
    modalStatus: 'info'
  },
  reducers: {
    // Asignamos el id
    setId(state, action) {
      state.id = action.payload
    },

    // Asignamos los idiomas
    setUserCommissions(state, action) {
      state.userCommissions = action.payload
    },

    // Asignamos la idioma
    setUserCommission(state, action) {
      state.userCommission = action.payload
    },

    // Modificamos un idioma en el array
    replaceUserCommissions(state, action) {
      const updatedUserCommission = action.payload
      const index = state.userCommissions.findIndex(role => role.id === updatedUserCommission.id)
      if (index !== -1) {
        state.userCommissions[index] = updatedUserCommission
      }
    },
    updateUserCommissionById(state, action) {
      const { role_id } = action.payload
      const index = state.userCommissions.findIndex(role => role.id === role_id)

      if (index !== -1) {
        state.userCommissions[index].user_has_role = user_has_role
      }
    },
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

    closeModal(state) {
      state.modalOpen = false
      state.showModal = false
      state.modalMode = 'view'
      state.modalStatus = 'info'
      state.id = null
    }
  }
})

export const userCommissionActions = userCommissionSlice.actions

export default userCommissionSlice.reducer
