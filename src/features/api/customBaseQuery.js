// src/features/api/customBaseQuery.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../auth/authSlice';

const baseQueryWithInterceptor = fetchBaseQuery({
  baseUrl: 'https://app.sbresto.com/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token || localStorage.getItem('authToken');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const customBaseQuery = async (args, api, extraOptions) => {
  const result = await baseQueryWithInterceptor(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(logout());
    window.location.href = '/';
    return { error: { status: 401, data: 'Session expired' } };
  }
  return result;
};

export default customBaseQuery;
