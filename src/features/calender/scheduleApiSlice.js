// src/features/calender/scheduleApiSlice.js
// (adjust the folder name if it's actually "calendar")

import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery';

export const scheduleApi = createApi({
  reducerPath: 'scheduleApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Schedule', 'FollowUp'], // added FollowUp tag
  endpoints: (builder) => ({

    // 1️⃣ Book a meeting slot for a lead
    bookLeadMeeting: builder.mutation({
      query: ({ leadId, date, start_time, end_time, lead_id }) => ({
        url: `/leads/schedule/${leadId}/book`,
        method: 'POST',
        body: { date, start_time, end_time, lead_id },
      }),
      invalidatesTags: ['Schedule'],
    }),

    // 2️⃣ Get available slots for a lead on a specific date
    getAvailableLeadSlots: builder.query({
      query: ({ leadId, date }) => ({
        url: `/leads/schedule/${leadId}/available?date=${date}`,
        method: 'GET',
      }),
      providesTags: ['Schedule'],
    }),

    // 3️⃣ (Optional) Set multiple lead schedules at once
    setLeadSchedule: builder.mutation({
      query: (schedules) => ({
        url: '/leads/schedule/set',
        method: 'POST',
        body: { schedules },
      }),
      invalidatesTags: ['Schedule'],
    }),

    // 4️⃣ NEW: Get all follow-ups for a specific user/lead
    getLeadFollowUps: builder.query({
      /**
       * @param {Object} params
       * @param {number|string} params.leadId   – required, the user’s ID
       * @param {string} [params.userType]      – role name (defaults to "salmen")
       * @param {number} [params.page]          – pagination page (defaults to 1)
       */
      query: ({ leadId, userType = 'salmen', page = 1 }) => ({
        url: `/leads/follow-ups/${leadId}?userType=${encodeURIComponent(
          userType
        )}&page=${page}`,
        method: 'GET',
      }),
      providesTags: ['FollowUp'],
    }),

  }),
});

// ✅ Export all RTK Query hooks for components
export const {
  useBookLeadMeetingMutation,
  useGetAvailableLeadSlotsQuery,
  useSetLeadScheduleMutation,
  useGetLeadFollowUpsQuery,   // <— new hook for follow-ups
} = scheduleApi;
