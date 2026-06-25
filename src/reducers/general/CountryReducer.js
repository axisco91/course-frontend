import { createSlice } from "@reduxjs/toolkit";

// Reducer donde se guarda los generos
const countrySlice = createSlice({
    name: 'country',
    initialState: {
        countries: null,
    },
    reducers: {
        setCountries(state, action) {
            state.countries = action.payload
        }
    }
})

export const countryActions = countrySlice.actions;

export default countrySlice.reducer;