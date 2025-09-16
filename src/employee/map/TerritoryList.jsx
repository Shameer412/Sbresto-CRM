import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Search, MapPin, ChevronsLeft, ChevronsRight, Plus, X,
  Calendar, Clock, Route, Layers, BarChart3
} from "lucide-react";

import {
   useDeleteItineraryItemMutation,
   useListItineraryItemsQuery,
} from "../../features/territory/TerritoryApiSlice";
import TerritoryMapUpdate from "./UpdateTerritoryModel.jsx";
import ItineraryViewerModel from "./ItineraryViewerModal.jsx";

/* ---------------------------
 *  Tiny UI Helpers
 * --------------------------- */
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
          className={`absolute z-[100] px-3 py-2 text-xs font-medium rounded-lg bg-gray-800 text-white shadow-xl whitespace-nowrap border border-gray-700 transition-all duration-200 ${
            position === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2' : ''
          }`}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-gray-700" />
        </div>
      )}
    </div>
  );
};

const Badge = ({ children, className = '', onRemove }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-full ${className} ${
      onRemove ? 'pr-1' : ''
    }`}
  >
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none"
      >
        <X className="h-3 w-3" />
      </button>
    )}
  </div>
);

const SkeletonCard = () => (
  <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse shadow-sm">
    <div className="h-2 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded-md" />
          <div className="h-4 w-20 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

const TypeBadge = ({ type }) => {
  const variants = {
    radius: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", icon: "○" },
    polygon:{ bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", icon: "◊" },
    default: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", icon: "?" }
  };
  const style = variants[type] || variants.default;
  return (
    <Badge className={`${style.bg} ${style.text} ${style.border} border font-mono`}>
      <span className="font-mono">{style.icon}</span>
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

/* ---------------------------
 *  Stats Modal
 * --------------------------- */
function ItineraryStatsModal({ open, onClose, item }) {
  if (!open || !item) return null;
  const stats = item.stats || {};
  const metrics = [
    { key: 'homesVisited', label: 'Homes Visited' },
    { key: 'leadsCreated', label: 'Leads Created' },
    { key: 'conversions', label: 'Conversions' },
    { key: 'followUps', label: 'Follow-ups Scheduled' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Itinerary Stats</h3>
            <p className="text-sm text-gray-500 truncate">{item?.name || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-2xl font-semibold text-gray-800">{Number(stats[m.key] ?? 0)}</div>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100">Close</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
 *  Main Component
 * --------------------------- */
export default function ItineraryGrid({ onView, onEdit, onCreate }) {
  const [editId, setEditId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [statsItem, setStatsItem] = useState(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
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

  const [doDelete] = useDeleteItineraryItemMutation();

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
    if (!window.confirm("Are you sure you want to delete this itinerary?")) return;
    try { await doDelete(id).unwrap(); }
    catch (e) { console.error(e); alert(e?.data?.message || "Failed to delete item"); }
  };

  const clearFilters = () => { setActiveFilters({ type: null, hasColor: null }); setQuery(""); };
  const hasActiveFilters = activeFilters.type || activeFilters.hasColor !== null || query;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {Array.from({ length: perPage }).map((_, i) => (<SkeletonCard key={i} />))}
          </div>
        ) : isError ? (
          <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center">
            <div className="text-lg font-semibold mb-2">Failed to load itineraries</div>
            <div className="text-sm mb-4 max-w-md mx-auto">{error?.data?.message || "An unknown error occurred."}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-100 hover:bg-red-200 border border-red-200 rounded-xl font-medium">
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 bg-gray-50 border border-gray-200 rounded-2xl text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No itineraries found</h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters ? "Try adjusting your search or filters."
                  : "Get started by creating your first itinerary."}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium">
                  <X className="w-4 h-4" /> Clear all filters
                </button>
              ) : onCreate ? (
                <button onClick={onCreate} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow">
                  <Plus className="w-5 h-5" /> Create Your First Itinerary
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="h-2 w-full" style={{ background: item.color || "#e5e7eb" }} />
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 truncate mb-2" title={item.name}>{item.name}</h3>
                        <TypeBadge type={item.type} />
                      </div>
                      <div className="shrink-0">
                        {item.color ? (
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: item.color }} />
                        ) : (
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                            <span className="w-2 h-2 bg-gray-400 rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      {item.type === 'radius' && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Radius: {Number(item.radius ?? 0).toFixed(1)} km</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="truncate">
                          {item.center_lat && item.center_lng ? `${Number(item.center_lat).toFixed(3)}, ${Number(item.center_lng).toFixed(3)}` : "No coordinates"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-3 h-3 text-gray-400" />
                        <span>{item.polygon?.coordinates?.[0]?.length ? `${item.polygon.coordinates[0].length} points` : 'No polygon data'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3" /> Created
                        </div>
                        <div className="text-xs font-medium text-gray-700">{formatDate(item.created_at)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Updated
                        </div>
                        <div className="text-xs font-medium text-gray-700">{formatDate(item.updated_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Tooltip content="View details">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200"
                            onClick={() => setViewId(item.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        <Tooltip content="Edit itinerary">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200"
                            onClick={() => setEditId(item.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Tooltip>

                        <Tooltip content="View stats">
                          <button
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200"
                            onClick={() => setStatsItem(item)}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>

                      <Tooltip content="Delete itinerary">
                        <button
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-1 mt-8">
              <button
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={!canPrev}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pages.map((p, idx) =>
                p === -1 ? (
                  <span key={idx} className="px-2">…</span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-lg border ${
                      p === page
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={!canNext}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Modals */}
        {editId && (
          <TerritoryMapUpdate
            id={editId}
            onClose={() => setEditId(null)}
            onUpdated={() => setEditId(null)}
          />
        )}

        {viewId && (
          <ItineraryViewerModel
            id={viewId}
            onClose={() => setViewId(null)}
          />
        )}

        {statsItem && (
          <ItineraryStatsModal
            open={!!statsItem}
            item={statsItem}
            onClose={() => setStatsItem(null)}
          />
        )}
      </div>
    </div>
  );
}
