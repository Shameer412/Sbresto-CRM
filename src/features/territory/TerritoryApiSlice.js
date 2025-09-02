// src/features/itineraries/itinerariesApiSlice.js
import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery';

const PATHS = {
  create: 'leads/itineraries/create/item',
  list: 'leads/itineraries/get/list',
  show: (id) => `leads/itineraries/get/show/${id}`,
  update: (id) => `leads/itineraries/update/data/${id}`,
  destroy: (id) => `leads/itineraries/delete/data/${id}`,
  addUsersToTerritory: (id) => `leads/itineraries/add/users/in/info/teritory/${id}`,
    createHouseInfo: 'leads/itineraries/store/house/data/info/store',
  // ✅ NEW: Update a single house info inside an itinerary
  updateHouseInfo: (id) => `leads/itineraries/update/house/data/info/${id}`,
};

const buildRadiusBody = ({ name, radius, color }) => ({
  name,
  type: 'radius',
  radius,
  ...(color ? { color } : {}),
});

const buildPolygonBody = ({ name, polygon, color }) => ({
  name,
  type: 'polygon',
  polygon,
  ...(color ? { color } : {}),
});

export const itinerariesApi = createApi({
  reducerPath: 'itinerariesApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Itinerary', 'ItineraryList'],

  endpoints: (builder) => ({

    // CREATE
    createItineraryItem: builder.mutation({
      query: ({ type, payload }) => {
        const body = type === 'radius' ? buildRadiusBody(payload) : buildPolygonBody(payload);
        return { url: PATHS.create, method: 'POST', body };
      },
      invalidatesTags: (result) => {
        const id = result?.data?.id;
        return id ? ['ItineraryList', { type: 'Itinerary', id }] : ['ItineraryList'];
      },
    }),

    getItineraryById: builder.query({
      query: (id) => ({ url: PATHS.show(id), method: 'GET' }),
      transformResponse: (raw) => {
        const item = raw?.data ?? {};
        return { data: item, message: raw?.message ?? null };
      },
      providesTags: (result, error, id) => (result ? [{ type: 'Itinerary', id }] : []),
    }),

    // READ (LIST) — paginated
    listItineraryItems: builder.query({
      query: (params) => ({ url: PATHS.list, method: 'GET', params }),
      transformResponse: (raw) => {
        const p = raw?.data ?? {};
        const arr = Array.isArray(p?.data) ? p.data : [];
        const items = arr.map((it) => ({
          ...it,
          radius: it?.radius != null && it.radius !== '' ? Number(it.radius) : it?.radius ?? null,
        }));
        const meta = {
          message: raw?.message ?? null,
          current_page: p?.current_page ?? 1,
          per_page: p?.per_page ?? items.length,
          total: p?.total ?? items.length,
          last_page: p?.last_page ?? 1,
          from: p?.from ?? null,
          to: p?.to ?? null,
          next_page_url: p?.next_page_url ?? null,
          prev_page_url: p?.prev_page_url ?? null,
          path: p?.path ?? null,
          first_page_url: p?.first_page_url ?? null,
          last_page_url: p?.last_page_url ?? null,
          links: p?.links ?? [],
        };
        return { items, meta };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}:${JSON.stringify(queryArgs ?? {})}`,
      providesTags: (result, error) => {
        if (error || !result) return [{ type: 'ItineraryList' }];
        const items = Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.data?.data)
          ? result.data.data
          : [];
        return [
          { type: 'ItineraryList' },
          ...items.filter((i) => i && i.id != null).map((i) => ({ type: 'Itinerary', id: i.id })),
        ];
      },
      keepUnusedDataFor: 60,
    }),

    // UPDATE
    updateItineraryItem: builder.mutation({
      query: ({ id, type, payload }) => {
        const body = type === 'radius' ? buildRadiusBody(payload) : buildPolygonBody(payload);
        return { url: PATHS.update(id), method: 'PUT', body };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Itinerary', id }, 'ItineraryList'],
    }),

    // ✅ NEW: Update a specific house in itinerary (POST body: { notes, status, ... })
    updateItineraryHouseInfo: builder.mutation({
      // Usage: updateItineraryHouseInfo({ id: 5, notes: 'Visited', status: 'Visited' })
    query: ({ itineraryId, ...payload }) => {
   if (!itineraryId) throw new Error('itineraryId is required');
   return {
     url: PATHS.updateHouseInfo(itineraryId),
     method: 'POST',
     body: payload, // includes { id: <houseId>, first_name, last_name, email, phone, notes }
    };
  },
      // Response example you shared is passed through as-is
      transformResponse: (raw) => ({
        message: raw?.message ?? null,
        data: raw?.data ?? null,
      }),
      invalidatesTags: (result, error, { itineraryId }) => [{ type: 'Itinerary', id: itineraryId }, 'ItineraryList'],
    }),

    // DELETE
    deleteItineraryItem: builder.mutation({
      query: (id) => ({ url: PATHS.destroy(id), method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Itinerary', id }, 'ItineraryList'],
    }),

    assignUsersToTerritory: builder.mutation({
      query: ({ territoryId, user_ids }) => ({
        url: PATHS.addUsersToTerritory(territoryId),
        method: 'POST',
        body: { user_ids },
      }),
      transformResponse: (raw) => ({ message: raw?.message ?? null, data: raw?.data ?? null }),
      invalidatesTags: (result, error, { territoryId }) => [{ type: 'Itinerary', id: territoryId }, 'ItineraryList'],
    }),
     // NEW: create a brand-new house anywhere (inside/outside territory)
    createItineraryHouseInfo: builder.mutation({
      // body example given in your message
      query: (body) => ({
        url: PATHS.createHouseInfo,
        method: 'POST',
        body,
      }),
      transformResponse: (raw) => ({
        message: raw?.message ?? null,
        data: raw?.data ?? null, // expect new house object with id, lat/lng, etc.
      }),
      // invalidate list + specific itinerary
      invalidatesTags: (result, error, { itinerary_id }) =>
        [{ type: 'Itinerary', id: itinerary_id }, 'ItineraryList'],
    }),

  }),
});

export const {
  useCreateItineraryItemMutation,
  useListItineraryItemsQuery,
  useUpdateItineraryItemMutation,
  useDeleteItineraryItemMutation,
  useGetItineraryByIdQuery,
  useAssignUsersToTerritoryMutation,

   useCreateItineraryHouseInfoMutation,
  useUpdateItineraryHouseInfoMutation,
} = itinerariesApi;
