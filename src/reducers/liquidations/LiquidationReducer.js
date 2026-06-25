import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de las empresas
const liquidationSlice = createSlice({
  name: 'liquidation',
  initialState: {
    id: null,
    showEliminateDialog: false,
    liquidations: [],

    // UI modal
    modalOpen: false,
    modalMode: 'view' // 'view' | 'edit' | 'create'
  },
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setShowEliminateDialog(state, action) {
      state.showEliminateDialog = action.payload
    },
    setLiquidations(state, action) {
      state.liquidations = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeLiquidationModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    }
  }
})

export const liquidationActions = liquidationSlice.actions

export default liquidationSlice.reducer
