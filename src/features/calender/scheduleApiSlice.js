import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery';

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Schedule'],
  endpoints: (builder) => ({

    // 1. Book a meeting slot for a lead
    bookLeadMeeting: builder.mutation({
      query: ({ leadId, date, start_time, end_time }) => ({
        url: `/leads/schedule/${leadId}/book`,
        method: 'POST',
        body: { date, start_time, end_time },
      }),
      invalidatesTags: ['Schedule'],
    }),

    // 2. Get available slots for a lead on a specific date
    getAvailableLeadSlots: builder.query({
      query: ({ leadId, date }) => ({
        url: `/leads/schedule/${leadId}/available?date=${date}`,
        method: 'GET',
      }),
      providesTags: ['Schedule'],
    }),

    // (your old method, optional now)
    setLeadSchedule: builder.mutation({
      query: (schedules) => ({
        url: '/leads/schedule/set',
        method: 'POST',
        body: { schedules },
      }),
    }),

  }),
});

// Export RTK Query hooks:
export const {
  useBookLeadMeetingMutation,        
  useGetAvailableLeadSlotsQuery,     
  useSetLeadScheduleMutation,        
} = scheduleApi;
