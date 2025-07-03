import React, { useState, useEffect } from "react";
import {
  useGetFollowUpsQuery,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} from "../../features/leads/leadsApiSlice";
import {
  Edit, Trash2, Calendar, CheckCircle, NotebookText,
  ChevronLeft, ChevronRight, Loader2, Plus, ChevronDown, ChevronUp,
  RefreshCw, Clock, AlertCircle, Check, Circle
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetUserLeadsQuery } from '../../features/api/apiSlice';

const FollowUpList = () => {
  // User info fetch
  const { data: leadsData, isLoading: isUserLoading } = useGetUserLeadsQuery();
  const userId = leadsData?.id;

  // State
  const [page, setPage] = useState(1);
  const [expandedCard, setExpandedCard] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // For new follow-up (if you use add functionality)
  const [newFollowUp, setNewFollowUp] = useState({
    lead_id: "",
    status: "pending",
    note: "",
    follow_up_date: "",
  });

  // Reset page to 1 if filter or userId changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter, userId]);

  // Main query: Only run if userId is loaded
  const {
    data: apiResponse = {},
    isLoading,
    isFetching,
    refetch
  } = useGetFollowUpsQuery(
    { userId, page, status: statusFilter !== "all" ? statusFilter : undefined },
    { skip: !userId }
  );

  // Mutations
  const [updateFollowUp, { isLoading: updating }] = useUpdateFollowUpMutation();
  const [deleteFollowUp, { isLoading: deleting }] = useDeleteFollowUpMutation();

  // Edit states
  const [editId, setEditId] = useState(null);
  const [editFields, setEditFields] = useState({
    status: "pending",
    note: "",
    follow_up_date: "",
  });

  // Data extract
  const followUps = apiResponse?.data?.data ?? [];
  const currentPage = apiResponse?.data?.current_page ?? 1;
  const lastPage = apiResponse?.data?.last_page ?? 1;
  const total = apiResponse?.data?.total ?? 0;

  // Status counts for cards
  const statusCounts = followUps.reduce((acc, fu) => {
    acc.all = (acc.all || 0) + 1;
    acc[fu.status] = (acc[fu.status] || 0) + 1;
    return acc;
  }, { all: 0 });

  // Helpers
  const startEdit = (fu) => {
    setEditId(fu.id);
    setEditFields({
      status: fu.status || "pending",
      note: fu.note || "",
      follow_up_date: fu.follow_up_date ? fu.follow_up_date.slice(0, 10) : "",
    });
    setExpandedCard(fu.id);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFields({ status: "pending", note: "", follow_up_date: "" });
  };

  const saveEdit = async (id) => {
    try {
      await updateFollowUp({ followUpId: id, ...editFields }).unwrap();
      toast.success("Follow-up updated successfully!", {
        className: 'bg-gray-800 text-white',
      });
      setEditId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Update failed", {
        className: 'bg-gray-800 text-white',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this follow-up?")) return;
    try {
      await deleteFollowUp(id).unwrap();
      toast.success("Follow-up deleted successfully!", {
        className: 'bg-gray-800 text-white',
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Delete failed", {
        className: 'bg-gray-800 text-white',
      });
    }
  };

  const getStatusColor = (status) => {
    const base = "px-2 py-1 text-xs rounded-full flex items-center";
    switch (status?.toLowerCase()) {
      case "completed":
        return `${base} bg-green-900/20 text-green-400 border border-green-800`;
      case "pending":
        return `${base} bg-yellow-900/20 text-yellow-400 border border-yellow-800`;
      case "rescheduled":
        return `${base} bg-blue-900/20 text-blue-400 border border-blue-800`;
      case "missed":
        return `${base} bg-red-900/20 text-red-400 border border-red-800`;
      default:
        return `${base} bg-gray-800/20 text-gray-300 border border-gray-700`;
    }
  };

  const getStatusIcon = (status) => {
    const className = "w-3 h-3 mr-1.5";
    switch (status?.toLowerCase()) {
      case "completed": return <CheckCircle className={className} />;
      case "pending": return <Clock className={`${className} animate-pulse`} />;
      case "rescheduled": return <RefreshCw className={className} />;
      case "missed": return <AlertCircle className={className} />;
      default: return <Circle className={className} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Pagination handlers: Only act if ready
  const handlePrev = () => {
    if (currentPage > 1 && !isLoading && userId) setPage(prev => prev - 1);
  };
  const handleNext = () => {
    if (currentPage < lastPage && !isLoading && userId) setPage(prev => prev + 1);
  };
  const handlePageClick = (pageNum) => {
    if (!isLoading && userId) setPage(pageNum);
  };

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  // UI block until user loaded
  if (isUserLoading || !userId) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-gray-400 text-lg">
        Loading user info...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Follow Up Management
            </h1>
            <p className="text-gray-400 mt-1 sm:mt-2">
              Track and manage your customer follow-ups
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Follow-ups */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-700 transition-all hover:border-indigo-500 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Follow-ups</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{total}</h3>
              </div>
              <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-indigo-500/20 transition-colors">
                <NotebookText className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-xs text-gray-400">All statuses</span>
              <button 
                onClick={() => setStatusFilter("all")}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                View all
              </button>
            </div>
          </div>
          {/* Pending */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-700 transition-all hover:border-yellow-500 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <h3 className="text-2xl font-bold mt-1 text-yellow-400">
                  {statusCounts.pending || 0}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-yellow-500/20 transition-colors">
                <Clock className="w-5 h-5 text-yellow-400/80 group-hover:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-xs text-gray-400">Awaiting action</span>
              <button 
                onClick={() => setStatusFilter("pending")}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                View pending
              </button>
            </div>
          </div>
          {/* Completed */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-700 transition-all hover:border-green-500 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Completed</p>
                <h3 className="text-2xl font-bold mt-1 text-green-400">
                  {statusCounts.completed || 0}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-green-500/20 transition-colors">
                <CheckCircle className="w-5 h-5 text-green-400 group-hover:text-green-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-xs text-gray-400">Successful follow-ups</span>
              <button 
                onClick={() => setStatusFilter("completed")}
                className="text-xs text-green-400 hover:text-green-300"
              >
                View completed
              </button>
            </div>
          </div>
          {/* Rescheduled */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 p-4 rounded-xl shadow-sm border border-gray-700 transition-all hover:border-blue-500 group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-400">Rescheduled</p>
                <h3 className="text-2xl font-bold mt-1 text-blue-400">
                  {statusCounts.rescheduled || 0}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-blue-500/20 transition-colors">
                <RefreshCw className="w-5 h-5 text-blue-400 group-hover:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-xs text-gray-400">Postponed follow-ups</span>
              <button 
                onClick={() => setStatusFilter("rescheduled")}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                View rescheduled
              </button>
            </div>
          </div>
        </div>

        {/* PAGINATION Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="text-sm text-gray-400">
            Showing page {currentPage} of {lastPage} • {total} total items
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
              onClick={handlePrev}
              disabled={currentPage === 1 || isLoading || !userId}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                let pageNum;
                if (lastPage <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= lastPage - 2) {
                  pageNum = lastPage - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageClick(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm flex items-center justify-center ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                    disabled={isLoading || !userId}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {lastPage > 5 && currentPage < lastPage - 2 && (
                <>
                  <span className="px-2 text-gray-500">...</span>
                  <button
                    onClick={() => handlePageClick(lastPage)}
                    className={`w-8 h-8 rounded-md text-sm flex items-center justify-center ${currentPage === lastPage ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                    disabled={isLoading || !userId}
                  >
                    {lastPage}
                  </button>
                </>
              )}
            </div>
            <button
              className={`flex items-center px-3 py-1 rounded-md text-sm ${currentPage === lastPage ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
              onClick={handleNext}
              disabled={currentPage === lastPage || isLoading || !userId}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : followUps.length > 0 ? (
          <div className="space-y-3">
            {followUps.map(fu => (
              <div
                key={fu.id}
                className={`bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700 transition-all duration-200 hover:shadow-md ${expandedCard === fu.id ? 'ring-2 ring-indigo-500/50' : ''}`}
              >
                {editId === fu.id ? (
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Edit Follow-up</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white transition-colors"
                          value={editFields.status}
                          onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}
                          disabled={updating}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="rescheduled">Rescheduled</option>
                          <option value="missed">Missed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white transition-colors"
                          value={editFields.follow_up_date}
                          onChange={(e) => setEditFields({ ...editFields, follow_up_date: e.target.value })}
                          disabled={updating}
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-800 text-white transition-colors"
                        rows="3"
                        value={editFields.note}
                        onChange={(e) => setEditFields({ ...editFields, note: e.target.value })}
                        placeholder="Enter notes about this follow-up"
                        disabled={updating}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button
                        className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        onClick={cancelEdit}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        onClick={() => saveEdit(fu.id)}
                        disabled={updating}
                      >
                        {updating ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            Saving...
                          </span>
                        ) : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-700/50 transition-colors"
                      onClick={() => toggleExpand(fu.id)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`p-2 rounded-full ${getStatusColor(fu.status)}`}>
                          {getStatusIcon(fu.status)}
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-sm sm:text-base">
                            Lead #{fu.lead_id || "N/A"}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 flex items-center mt-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {formatDate(fu.follow_up_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(fu.status)}>
                          {getStatusIcon(fu.status)}
                          {fu.status || "N/A"}
                        </span>
                        {expandedCard === fu.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {expandedCard === fu.id && (
                      <div className="px-4 pb-4 border-t border-gray-700">
                        <div className="mt-4">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-300 flex items-center mb-2">
                            <NotebookText className="w-4 h-4 mr-2" /> Notes
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-300 bg-gray-700/50 p-3 rounded-md">
                            {fu.note || "No notes available for this follow-up."}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                          <button
                            className="px-3 py-1.5 text-xs sm:text-sm border border-gray-700 rounded-md text-gray-300 hover:bg-gray-700 flex items-center justify-center transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(fu);
                            }}
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Edit
                          </button>
                          <button
                            className="px-3 py-1.5 text-xs sm:text-sm border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(fu.id);
                            }}
                            disabled={deleting}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {deleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-700">
            <NotebookText className="mx-auto h-12 w-12 text-gray-500" />
            <h3 className="mt-2 text-lg font-medium text-white">No follow-ups found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {statusFilter !== "all"
                ? "No follow-ups match your filter criteria"
                : "You don't have any follow-ups yet"}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 mx-auto transition-colors"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add New Follow-up
            </button>
          </div>
        )}

        {/* PAGINATION Bottom */}
        {followUps.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <div className="text-sm text-gray-400">
              Showing {followUps.length} of {total} items
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`flex items-center px-3 py-1 rounded-md text-sm ${currentPage === 1 ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                onClick={handlePrev}
                disabled={currentPage === 1 || isLoading || !userId}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                  let pageNum;
                  if (lastPage <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= lastPage - 2) {
                    pageNum = lastPage - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageClick(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm flex items-center justify-center ${currentPage === pageNum ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                      disabled={isLoading || !userId}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {lastPage > 5 && currentPage < lastPage - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => handlePageClick(lastPage)}
                      className={`w-8 h-8 rounded-md text-sm flex items-center justify-center ${currentPage === lastPage ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                      disabled={isLoading || !userId}
                    >
                      {lastPage}
                    </button>
                  </>
                )}
              </div>
              <button
                className={`flex items-center px-3 py-1 rounded-md text-sm ${currentPage === lastPage ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                onClick={handleNext}
                disabled={currentPage === lastPage || isLoading || !userId}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpList;
