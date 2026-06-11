import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  darkMode: boolean;
}

const initialState: UiState = {
  darkMode: localStorage.getItem('theme') === 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.darkMode = !state.darkMode;
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
    },
  },
});

export const { toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
