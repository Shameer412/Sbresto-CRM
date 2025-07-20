// src/features/leads/leadsApiSlice.js
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery';

export const leadsApiSlice = createApi({
  reducerPath: 'leadsApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Leads', 'FollowUp'],
  endpoints: (builder) => ({

    // LEADS CRUD
    getLeads: builder.query({
      query: ({ page, filter }) => {
        if (page === undefined) throw new Error('Page is required');
        let url = `/leads?page=${page}`;
        if (filter) url += `&filter=${encodeURIComponent(filter)}`;
        return { url, method: 'GET' };
      },
      providesTags: ['Leads'],
      keepUnusedDataFor: 300,
    }),
    createLead: builder.mutation({
      query: (newLeadData) => ({
        url: '/leads',
        method: 'POST',
        body: newLeadData,
      }),
      invalidatesTags: ['Leads'],
    }),
    getLeadById: builder.query({
      query: (leadId) => ({
        url: `/leads/${leadId}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),
    deleteLead: builder.mutation({
      query: (leadId) => ({
        url: `/leads/${leadId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Leads'],
    }),
    updateLead: builder.mutation({
      query: ({ leadId, ...patch }) => ({
        url: `/leads/${leadId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { leadId }) => [
        'Leads',
        { type: 'Leads', id: leadId },
      ],
    }),

    // LEAD STATIC DATA
    getLeadStatuses: builder.query({
      query: () => ({
        url: '/leads/all/status',
        method: 'GET',
      }),
      providesTags: ['Leads'],
      
    }),
    getLeadSources: builder.query({
      query: () => ({
        url: '/leads/all/source',
        method: 'GET',
      }),
      providesTags: ['Leads'],
      
    }),
  getLeadUsers: builder.query({
  query: (page = 1) => ({
    url: `/leads/fetch/users?page=${page}`,
    method: 'GET',
  }),
  providesTags: ['Leads'],
}),


    // LEAD NOTES
    saveLeadNote: builder.mutation({
      query: ({ leadId, notes }) => ({
        url: `/leads/save/lead/notes/${leadId}`,
        method: 'POST',
        body: { notes },
      }),
      invalidatesTags: ['Leads'],
    }),

    // FOLLOW-UP CRUD

    // GET all follow-ups for a specific lead
    getFollowUps: builder.query({
  query: (userId) => ({
    url: `/leads/follow-ups/${userId}`,
    method: 'GET',
  }),
  providesTags: ['Leads'],

}),

    // GET single follow-up by follow-up id
    getFollowUpById: builder.query({
      query: (followUpId) => ({
        url: `/leads/follow-ups/${followUpId}`,
        method: 'GET',
      }),
      providesTags: (result, error, followUpId) => [{ type: 'FollowUp', id: followUpId }],
    }),

    // CREATE new follow-up for a lead (lead_id required in body)
    createFollowUp: builder.mutation({
      query: ({ note, follow_up_date, status, lead_id }) => ({
        url: `/leads/follow-ups/${lead_id}`,
        method: 'POST',
        body: { note, follow_up_date, status, lead_id },
      }),
      invalidatesTags: ['FollowUp', 'Leads'],
    }),

    // UPDATE existing follow-up by id
    updateFollowUp: builder.mutation({
      query: ({ followUpId, ...patch }) => ({
        url: `/leads/follow-ups/${followUpId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { followUpId }) => [
        { type: 'FollowUp', id: followUpId },
        { type: 'FollowUp', id: 'LIST' },
        'Leads'
      ],
    }),

    // DELETE a follow-up by id
    deleteFollowUp: builder.mutation({
      query: (followUpId) => ({
        url: `/leads/follow-ups/${followUpId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, followUpId) => [
        { type: 'FollowUp', id: followUpId },
        { type: 'FollowUp', id: 'LIST' },
        'Leads'
      ],
    }),
    // Leads export Link 
     exportLeads: builder.query({
      query: () => ({
        url: '/leads/export/leads',
        method: 'GET',
      }),
      transformResponse: (response) => response.download_link,
    }),
    // INVITE - Send Invitation Email
sendInvite: builder.mutation({
  query: ({ email }) => ({
    url: '/invite/send',
    method: 'POST',
    body: { email },
  }),
}),

  }),
});

// Export hooks
export const {
  // Lead CRUD
  useGetLeadsQuery,
  useCreateLeadMutation,
  useGetLeadByIdQuery,
  useDeleteLeadMutation,
  useUpdateLeadMutation,
   useExportLeadsQuery,
  // Static/Options
  useGetLeadStatusesQuery,
  useGetLeadSourcesQuery,
  useGetLeadUsersQuery,
  useSendInviteMutation,

  // Notes
  useSaveLeadNoteMutation,

  // Follow-up CRUD
  useGetFollowUpsQuery,
  useGetFollowUpByIdQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} = leadsApiSlice;
