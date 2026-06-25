import { createSlice } from '@reduxjs/toolkit'

// Reducer donde se guarda los datos de las empresas
const companySettingSlice = createSlice({
  name: 'companySetting',
  initialState: {
    companySettings: []
  },
  reducers: {
    setCompanySettings(state, action) {
      state.companySettings = action.payload
    }
  }
})

export const companySettingActions = companySettingSlice.actions

export default companySettingSlice.reducer
