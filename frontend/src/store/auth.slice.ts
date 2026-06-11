import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
      id: string;
      name: string;
      permissions: string[];
    };
  } | null;
}

const initialState: AuthState = {
  accessToken: localStorage.getItem('accessToken'),
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: AuthState['user'] }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
