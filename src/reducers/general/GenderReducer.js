import { createSlice } from "@reduxjs/toolkit";

// Reducer donde se guarda los generos
const genderSlice = createSlice({
    name: 'gender',
    initialState: {
        genders: null,
    },
    reducers: {
        setGenders(state, action) {
            state.genders = action.payload
        }
    }
})

export const genderActions = genderSlice.actions;

export default genderSlice.reducer;