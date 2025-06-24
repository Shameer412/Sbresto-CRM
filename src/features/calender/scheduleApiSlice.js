// src/features/api/scheduleApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery'; 

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: customBaseQuery, 
  tagTypes: ['Schedule'],
  endpoints: (builder) => ({
    setSchedule: builder.mutation({
      query: (body) => ({
        url: '/leads/schedule/set', 
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Schedule'],
    }),
    getAvailableSlots: builder.query({
      query: ({ id, date }) => `/leads/schedule/${id}/available?date=${date}`,
      providesTags: ['Schedule'],
    }),
    bookSlot: builder.mutation({
      query: ({ id, date, start_time, end_time }) => ({
        url: `/leads/schedule/${id}/book`,
        method: 'POST',
        body: { date, start_time, end_time },
      }),
      invalidatesTags: ['Schedule'],
    }),
    getSalespersonSchedule: builder.query({
      query: (salespersonId) => `/leads/schedule/${salespersonId}`,
      providesTags: ['Schedule'],
    }),
  }),
});

export const {
  useSetScheduleMutation,
  useGetAvailableSlotsQuery,
  useBookSlotMutation,
  useGetSalespersonScheduleQuery
} = scheduleApi;
