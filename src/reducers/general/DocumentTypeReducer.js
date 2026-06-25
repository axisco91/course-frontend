import { createSlice } from '@reduxjs/toolkit'

const documentTypeSlice = createSlice({
  name: 'documentType',
  initialState: {
    documentTypes: []
  },
  reducers: {
    setDocumentTypes(state, action) {
      state.documentTypes = action.payload
    }
  }
})

export const documentTypeActions = documentTypeSlice.actions
export default documentTypeSlice.reducer
