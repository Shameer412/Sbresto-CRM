// src/features/api/apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from '../auth/authSlice';

// Custom baseQuery with token header & 401 handling
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

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: customBaseQuery,
  tagTypes: ['Leads', 'Notifications', 'LeadsStats'],
  endpoints: (builder) => ({
    // ========== AUTH ==========
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    // ========== LEADS ==========
    getUserLeads: builder.query({
      query: () => ({
        url: '/leads/logged/user',
        method: 'GET',
      }),
      providesTags: ['Leads'],
      keepUnusedDataFor: 300,
      // To normalize response
      transformResponse: (res) => Array.isArray(res) ? res : (res.data || []),
    }),
    updateUserLeads: builder.mutation({
      query: (updateData) => ({
        url: '/leads/logged/user',
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['Leads'],
      transformResponse: (res) => res.data || res,
    }),

    // ========== NOTIFICATIONS ==========
    getNotifications: builder.query({
      query: () => ({
        url: '/notifications',
        method: 'GET',
      }),
      providesTags: ['Notifications'],
      
    }),
    markNotificationAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/read/${notificationId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsAsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),

    // ========== LEAD STATS ==========
    getUserLeadsStats: builder.query({
      query: () => ({
        url: '/leads/user/stats',
        method: 'GET',
      }),
      providesTags: ['LeadsStats'],
      
    }),
    // ========== SALESPEOPLE ==========
getSalespeople: builder.query({
  query: () => ({
    url: '/leads/fetch/users',
    method: 'GET',
    params: { userType: 'salesperson' },
  }),
  providesTags: ['Salespeople'],
 
 
}),

  }),
  
});

// Export all the hooks you need
export const {
  useLoginUserMutation,
  useGetUserLeadsQuery,
  useUpdateUserLeadsMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useGetUserLeadsStatsQuery,
  useGetSalespeopleQuery,
} = apiSlice;
