import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import { apiSlice } from '../features/api/apiSlice';
import { leadsApiSlice } from '../features/leads/leadsApiSlice';
import { scheduleApi } from '../features/calender/scheduleApiSlice'; 


const preloadedState = {
  auth: {
      user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('authToken') || null,
  },
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [leadsApiSlice.reducerPath]: leadsApiSlice.reducer,
    [scheduleApi.reducerPath]: scheduleApi.reducer, 
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(
        apiSlice.middleware,
        leadsApiSlice.middleware,
        scheduleApi.middleware 
      ),
  preloadedState,
});



