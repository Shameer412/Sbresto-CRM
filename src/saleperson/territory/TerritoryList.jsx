import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Search, MapPin, ChevronsLeft, ChevronsRight, Plus, X,
  Calendar, Clock, Route, Layers, Users as UsersIcon
} from "lucide-react";

import {
   useDeleteItineraryItemMutation,
  useListItineraryItemsQuery,
} from "../../features/territory/TerritoryApiSlice";
import TerritoryMapUpdate from "./UpdateTerritoryModel.jsx";
import ItineraryViewerModel from "./ItineraryViewerModel.jsx";

/* ===========================
 *  Tiny UI Helpers
 * =========================== */
const Tooltip = ({ content, children, position = 'top' }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-[100] px-3 py-2 text-xs font-medium rounded-lg bg-gray-900 text-white shadow-xl whitespace-nowrap transition-all duration-200 border border-gray-700 ${
            position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' : ''
          }`}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
        </div>
      )}
    </div>
  );
};

const Badge = ({ children, className = '', onRemove }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-700/50 text-gray-200 border border-gray-600 rounded-full transition-colors ${className} ${
      onRemove ? 'pr-1' : ''
    }`}
  >
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-current hover:bg-opacity-20 focus:outline-none transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </div>
);

const SkeletonCard = () => (
  <div className="group relative bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-2 w-full bg-gradient-to-r from-gray-700/30 via-gray-600/30 to-gray-700/30" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-700/30 rounded-md" />
          <div className="h-4 w-20 bg-gray-700/30 rounded-full" />
        </div>
        <div className="h-8 w-8 bg-gray-700/30 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-700/30 rounded" />
        <div className="h-3 w-16 bg-gray-700/30 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-gray-700/30 rounded-xl" />
        <div className="h-12 bg-gray-700/30 rounded-xl" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-700/30 rounded-lg" />
          <div className="h-8 w-8 bg-gray-700/30 rounded-lg" />
        </div>
        <div className="h-8 w-8 bg-red-900/30 rounded-lg" />
      </div>
    </div>
  </div>
);

const TypeBadge = ({ type }) => {
  const variants = {
    radius: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30", icon: "○", iconColor: "text-emerald-400" },
    polygon:{ bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-500/30", icon: "◊", iconColor: "text-blue-400" },
    default: { bg: "bg-gray-500/20", text: "text-gray-300", border: "border-gray-500/30", icon: "?", iconColor: "text-gray-400" }
  };
  const style = variants[type] || variants.default;
  return (
    <Badge className={`${style.bg} ${style.text} ${style.border} border font-mono`}>
      <span className={`${style.iconColor} font-mono`}>{style.icon}</span>
      <span className="capitalize">{type || "Unknown"}</span>
    </Badge>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: diff > 31536000 ? "numeric" : undefined });
  } catch { return dateString; }
};



/* ===========================
 *   MAIN COMPONENT
 * =========================== */
export default function ItineraryGrid({ onView, onEdit, onCreate }) {
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);



  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeFilters, setActiveFilters] = useState({ type: null, hasColor: null });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isLoading, isError, error } = useListItineraryItemsQuery({
    page,
    per_page: perPage,
    search: debounced || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...activeFilters,
  });

  const [doDelete, { isLoading: isDeleting }] = useDeleteItineraryItemMutation();

  const items = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  useEffect(() => { setPage(1); }, [debounced, activeFilters, sortBy, sortOrder]);

  const pages = useMemo(() => {
    const last = totalPages, current = page, delta = 2;
    const left = current - delta, right = current + delta + 1;
    const range = [], result = [];
    for (let i = Math.max(2, left); i < Math.min(last, right); i++) range.push(i);
    if (left > 2) { if (left > 3) result.push(1, -1); else result.push(1); } else { result.push(1); }
    result.push(...range);
    if (right < last) { if (right < last - 1) result.push(-1, last); else result.push(last); }
    else if (last > 1) result.push(last);
    return result;
  }, [page, totalPages]);

  const handleDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm("Are you sure you want to delete this itinerary? This action cannot be undone.");
    if (!ok) return;
    try { await doDelete(id).unwrap(); }
    catch (e) { console.error(e); alert(e?.data?.message || "Failed to delete item"); }
  };

  const toggleFilter = (filter, value) => {
    setActiveFilters(prev => ({ ...prev, [filter]: prev[filter] === value ? null : value }));
  };

  const clearFilters = () => { setActiveFilters({ type: null, hasColor: null }); setQuery(""); };

  const hasActiveFilters = activeFilters.type || activeFilters.hasColor !== null || query;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Content */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6" : "space-y-4"}>
            {Array.from({ length: perPage }).map((_, i) => (<SkeletonCard key={i} />))}
          </div>
        ) : isError ? (
          <div className="p-8 bg-red-900/10 border border-red-800/50 rounded-2xl text-red-300 flex flex-col items-center text-center backdrop-blur-sm">
            <div className="text-lg font-semibold mb-2">Failed to load itineraries</div>
            <div className="text-sm mb-4 max-w-md text-red-400">{error?.data?.message || "An unknown error occurred while fetching data"}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 rounded-xl text-red-100 transition-all duration-200 font-medium">
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 bg-gray-800/20 border border-gray-700/50 rounded-2xl text-center backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-2">No itineraries found</h3>
              <p className="text-gray-400 mb-6">
                {hasActiveFilters ? "Try adjusting your search or filters to find what you're looking for."
                  : "Get started by creating your first itinerary to organize your travel routes."}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              ) : onCreate ? (
                <button onClick={onCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:shadow-indigo-500/25">
                  <Plus className="w-5 h-5" /> Create Your First Itinerary
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-gray-800/40 backdrop-blur-sm hover:bg-gray-800/60 border border-gray-700/50 hover:border-gray-600/50 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="h-2 w-full" style={{ background: item.color || "linear-gradient(90deg, #e5e7eb, #d1d5db)" }} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-100 truncate" title={item.name}>{item.name}</h3>
                        </div>
                        <TypeBadge type={item.type} />
                      </div>
                      <div className="shrink-0">
                        {item.color ? (
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-600 shadow-md" style={{ backgroundColor: item.color }} />
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-600 bg-gray-700 flex items-center justify-center">
                            <span className="w-2 h-2 bg-gray-500 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-400">
                      {item.type === 'radius' && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Radius: {Number(item.radius ?? 0).toFixed(1)} km</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="truncate">
                          {item.center_lat && item.center_lng ? `${Number(item.center_lat).toFixed(3)}, ${Number(item.center_lng).toFixed(3)}` : "No coordinates"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-gray-500" />
                        <span>{item.polygon?.coordinates?.[0]?.length ? `${item.polygon.coordinates[0].length} points` : 'No polygon data'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" /> Created
                        </div>
                        <div className="text-xs font-medium text-gray-300">{formatDate(item.created_at)}</div>
                      </div>
                      <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Updated
                        </div>
                        <div className="text-xs font-medium text-gray-300">{formatDate(item.updated_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <Tooltip content="View details">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                            onClick={() => setViewId(item.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        {/* Edit */}
                        <Tooltip content="Edit itinerary">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 hover:text-gray-200 border border-gray-600/50 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                            onClick={() => setEditId(item.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        {/* Add Users */}
                        <Tooltip content="Add users">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                            onClick={() => {
                              setAddUsersForId(item.id);
                              setAddUsersForName(item.name || "");
                            }}
                          >
                            <UsersIcon className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Delete */}
                      <Tooltip content="Delete itinerary">
                        <button
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 border border-red-800/50 disabled:opacity-60 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                          onClick={() => handleDelete(item.id)}
                          disabled={isFetching || isDeleting}
                        >
                          {isDeleting ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Trash2 className="w-4 h-4" />)}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-400">
                Showing <span className="font-medium text-gray-200">{((page - 1) * perPage) + 1}</span> to{' '}
                <span className="font-medium text-gray-200">{Math.min(page * perPage, meta?.total ?? items.length)}</span> of{' '}
                <span className="font-medium text-gray-200">{meta?.total ?? items.length}</span> results
              </div>
              <div className="flex items-center gap-1">
                <Tooltip content="First page">
                  <button className="p-2 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150" onClick={() => setPage(1)} disabled={!canPrev || isFetching}>
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Previous page">
                  <button className="p-2 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev || isFetching}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </Tooltip>

                {(() => {
                  const last = totalPages, current = page, delta = 2;
                  const left = current - delta, right = current + delta + 1;
                  const range = [], result = [];
                  for (let i = Math.max(2, left); i < Math.min(last, right); i++) range.push(i);
                  if (left > 2) { if (left > 3) result.push(1, -1); else result.push(1); } else { result.push(1); }
                  result.push(...range);
                  if (right < last) { if (right < last - 1) result.push(-1, last); else result.push(last); }
                  else if (last > 1) result.push(last);
                  return result;
                })().map((p, idx) =>
                  p === -1 ? (
                    <span key={idx} className="px-2 text-gray-500 select-none">…</span>
                  ) : (
                    <Tooltip key={p} content={`Page ${p}`}>
                      <button
                        onClick={() => setPage(p)}
                        disabled={isFetching}
                        className={`min-w-[40px] px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                          p === page
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                            : "bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    </Tooltip>
                  )
                )}

                <Tooltip content="Next page">
                  <button className="p-2 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={!canNext || isFetching}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Last page">
                  <button className="p-2 rounded-lg border border-gray-600 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150" onClick={() => setPage(totalPages)} disabled={!canNext || isFetching}>
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View & Edit Modals */}
      <ItineraryViewerModel
        open={!!viewId}
        id={viewId}
        onClose={() => setViewId(null)}
      />
      {editId && (
        <TerritoryMapUpdate
          id={editId}
          open={!!editId}
          onClose={() => setEditId(null)}
        />
      )}

     
    </div>
  );
}
