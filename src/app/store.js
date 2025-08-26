// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import authReducer from '../features/auth/authSlice';
import { apiSlice } from '../features/api/apiSlice';
import { leadsApiSlice } from '../features/leads/leadsApiSlice';
import { scheduleApi } from '../features/calender/scheduleApiSlice';


import { itinerariesApi } from '../features/territory/TerritoryApiSlice';

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
    // ⬇️ add itineraries reducer
    [itinerariesApi.reducerPath]: itinerariesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat(
      apiSlice.middleware,
      leadsApiSlice.middleware,
      scheduleApi.middleware,
      // ⬇️ add itineraries middleware
      itinerariesApi.middleware
    ),
  preloadedState,
});

// enable refetchOnFocus/refetchOnReconnect, etc.
setupListeners(store.dispatch);
