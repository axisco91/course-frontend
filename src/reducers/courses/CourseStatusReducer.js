import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: null,
  courseStatuses: [],

  // UI modal
  modalOpen: false,
  modalMode: 'view' // 'view' | 'edit' | 'create'
}

const courseStatusSlice = createSlice({
  name: 'courseStatuses',
  initialState,
  reducers: {
    setId(state, action) {
      state.id = action.payload
    },
    setCourseStatuses(state, action) {
      state.courseStatuses = action.payload
    },
    openModal(state, action) {
      state.modalOpen = true
      state.modalMode = action.payload.mode
      if (action.payload.courseId !== undefined) {
        state.id = action.payload.courseId
      }
    },
    closeCourseStatusModal(state) {
      state.modalOpen = false
      state.modalMode = 'view'
      state.id = null
    }
  }
})

export const courseStatusActions = courseStatusSlice.actions
export default courseStatusSlice.reducer
