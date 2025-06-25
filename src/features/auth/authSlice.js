import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
   token: sessionStorage.getItem('authToken') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      sessionStorage.setItem('authToken', action.payload);
    },
    setUser: (state, action) => {
      state.user = action.payload;
       sessionStorage.setItem('user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
    },
  },
});

export const { setToken, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
