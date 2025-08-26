import { createApi } from '@reduxjs/toolkit/query/react';
import customBaseQuery from '../api/customBaseQuery';

const PATHS = {
  create: 'leads/itineraries/create/item',
  list: 'leads/itineraries/get/list',
  show: (id) => `leads/itineraries/get/show/${id}`,   
  update: (id) => `leads/itineraries/update/data/${id}`,
  destroy: (id) => `leads/itineraries/delete/data/${id}`,
    addUsersToTerritory: (id) =>  `leads/itineraries/add/users/in/info/teritory/${id}`,
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
  // color,
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
        const body =
          type === 'radius' ? buildRadiusBody(payload) : buildPolygonBody(payload);
        return {
          url: PATHS.create,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: (result) => {
        const id = result?.data?.id;
        return id
          ? ['ItineraryList', { type: 'Itinerary', id }]
          : ['ItineraryList'];
      },
    }),
    getItineraryById: builder.query({
  query: (id) => ({
    url: PATHS.show(id),
    method: 'GET',
  }),
  transformResponse: (raw) => {
    // raw ka structure waise hi hai jaisa aapne bheja:
    // { message: "Itinerary list fetched successfully.", data: {...} }
    const item = raw?.data ?? {};
    return { data: item, message: raw?.message ?? null };
  },
  providesTags: (result, error, id) =>
    result ? [{ type: 'Itinerary', id }] : [],
}),

    // READ (LIST) — paginated
    listItineraryItems: builder.query({
      query: (params) => ({
        url: PATHS.list,
        method: 'GET',
        params, // e.g. { page, per_page, ... }
      }),

      // Laravel paginator → normalize to { items, meta }
      transformResponse: (raw) => {
        const p = raw?.data ?? {};
        const arr = Array.isArray(p?.data) ? p.data : [];

        // Optional coercions: radius string -> number
        const items = arr.map((it) => ({
          ...it,
          radius:
            it?.radius != null && it.radius !== ''
              ? Number(it.radius)
              : it?.radius ?? null,
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

      // ensure cache key includes params (page/per_page)
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${JSON.stringify(queryArgs ?? {})}`,

      // SAFE providesTags (handles normalized, raw, or undefined)
      providesTags: (result, error) => {
        if (error || !result) return [{ type: 'ItineraryList' }];
        const items = Array.isArray(result?.items)
          ? result.items
          : Array.isArray(result?.data?.data)
          ? result.data.data
          : [];
        return [
          { type: 'ItineraryList' },
          ...items
            .filter((i) => i && i.id != null)
            .map((i) => ({ type: 'Itinerary', id: i.id })),
        ];
      },

      keepUnusedDataFor: 60,
    }),

    // UPDATE
    updateItineraryItem: builder.mutation({
      query: ({ id, type, payload }) => {
        const body =
          type === 'radius' ? buildRadiusBody(payload) : buildPolygonBody(payload);
        return {
          url: PATHS.update(id),
          method: 'PUT',
          body,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Itinerary', id },
        'ItineraryList',
      ],
    }),

    // DELETE
    deleteItineraryItem: builder.mutation({
      query: (id) => ({
        url: PATHS.destroy(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Itinerary', id },
        'ItineraryList',
      ],
    }),
    assignUsersToTerritory: builder.mutation({
  // input: { territoryId, user_ids: number[] }
  query: ({ territoryId, user_ids }) => ({
    url: PATHS.addUsersToTerritory(territoryId),
    method: 'POST',
    body: { user_ids },
  }),
  // API returns:
  // {
  //   "message": "Users assigned to teritory successfully.",
  //   "data": { "id": "1", "user_ids": [1,2] }
  // }
  transformResponse: (raw) => ({
    message: raw?.message ?? null,
    data: raw?.data ?? null,
  }),
  // invalidate the specific item (if territoryId maps to an itinerary id)
  invalidatesTags: (result, error, { territoryId }) => [
    { type: 'Itinerary', id: territoryId },
    'ItineraryList',
  ],
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
} = itinerariesApi;
