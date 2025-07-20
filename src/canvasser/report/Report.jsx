import React, { useState } from "react";
import { useGetLeadUsersQuery, useExportLeadsQuery, useSendInviteMutation } from "../../features/leads/leadsApiSlice";
import {
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiLoader,
  FiAlertCircle,
  FiMail,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiCheck,
  FiX
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

const UserLeadsDashboard = () => {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  
  const { 
    data: usersData = {}, 
    isLoading: isLoadingUsers, 
    isError: isUsersError, 
    refetch: refetchUsers
  } = useGetLeadUsersQuery(page);

  const { 
    data: downloadLink, 
    isLoading: isLoadingExport, 
    isError: isExportError, 
    refetch: refetchExport 
  } = useExportLeadsQuery();

  const [sendInvite, { 
    isLoading: isSendingInvite, 
    isSuccess: isInviteSuccess, 
    error: inviteError,
    data: inviteResponse
  }] = useSendInviteMutation();

  const users = usersData?.data?.data || [];
  const { total = 0, current_page = 1, last_page = 1, per_page = 10 } = usersData?.data || {};

  const handleExport = async () => {
    try {
      await refetchExport();
      if (downloadLink) {
        window.open(downloadLink, "_blank");
        toast.success("Export started successfully");
      }
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error("Export failed:", err);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      const response = await sendInvite({ email }).unwrap();
      setEmail("");
      setShowInviteForm(false);
      toast.success(response.message || "Invitation sent successfully!");
    } catch (err) {
      toast.error(err.data?.message || "Failed to send invitation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid #374151'
          }
        }}
      />
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-gray-400">{total} total users</p>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus /> Invite User
          </button>
        </div>

        {/* Invite User Modal */}
        <AnimatePresence>
          {showInviteForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-700"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Invite New User</h2>
                  <button 
                    onClick={() => {
                      setShowInviteForm(false);
                      setEmail("");
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSendingInvite}
                    className={`w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium flex items-center justify-center gap-2 ${
                      isSendingInvite ? 'opacity-70' : 'hover:bg-blue-700'
                    }`}
                  >
                    {isSendingInvite ? (
                      <>
                        <FiLoader className="animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <FiMail /> Send Invite
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl shadow border border-gray-700 overflow-hidden">
              {/* Controls */}
              <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-900 text-blue-300' : 'text-gray-400 hover:bg-gray-700'}`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-900 text-blue-300' : 'text-gray-400 hover:bg-gray-700'}`}
                  >
                    List
                  </button>
                </div>
                <button
                  onClick={refetchUsers}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-700"
                >
                  <FiRefreshCw />
                </button>
              </div>

              {/* Users List - Fixed Height Scrollable */}
              <div className="h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {isLoadingUsers ? (
                  <div className="h-full flex items-center justify-center">
                    <FiLoader className="animate-spin text-blue-500 text-2xl" />
                  </div>
                ) : isUsersError ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <FiAlertCircle className="text-red-500 text-3xl mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Failed to load users</h3>
                    <p className="text-gray-400 mb-4">Please try again later</p>
                    <button 
                      onClick={refetchUsers}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Retry
                    </button>
                  </div>
                ) : users.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6">
                    <FiUser className="text-gray-500 text-3xl mb-3" />
                    <p className="text-white font-medium mb-1">No users found</p>
                    <p className="text-gray-400">Try refreshing the page</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {users.map(user => (
                      <div key={user.id} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-700/50 transition">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-300 font-bold">
                            {user.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{user.name || 'Unknown'}</h3>
                            <p className="text-sm text-gray-400">{user.email || 'No email'}</p>
                          </div>
                        </div>
                        {user.status && (
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            user.status === 'active' ? 'bg-green-900/50 text-green-300' :
                            user.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {users.map(user => (
                      <div key={user.id} className="p-4 hover:bg-gray-700/30 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-300 font-bold">
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{user.name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-400">{user.email || 'No email'}</p>
                            </div>
                          </div>
                          {user.status && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.status === 'active' ? 'bg-green-900/50 text-green-300' :
                              user.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-700 flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Showing {((current_page - 1) * per_page) + 1}-{Math.min(current_page * per_page, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={current_page === 1}
                    className="p-2 rounded-lg border border-gray-600 disabled:opacity-50 hover:bg-gray-700"
                  >
                    <FiChevronLeft className="text-gray-300" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(last_page, p + 1))}
                    disabled={current_page === last_page}
                    className="p-2 rounded-lg border border-gray-600 disabled:opacity-50 hover:bg-gray-700"
                  >
                    <FiChevronRight className="text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Export Card */}
            <div className="bg-gray-800 rounded-xl shadow border border-gray-700 p-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center mb-3">
                  <FiDownload className="text-blue-400 text-xl" />
                </div>
                <h3 className="font-bold text-white mb-1">Export Data</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Download user data as CSV
                </p>
                <button
                  onClick={handleExport}
                  disabled={isLoadingExport}
                  className={`w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium ${
                    isLoadingExport ? 'opacity-70' : 'hover:bg-blue-700'
                  }`}
                >
                  {isLoadingExport ? 'Preparing...' : 'Export CSV'}
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gray-800 rounded-xl shadow border border-gray-700 p-4">
              <h3 className="font-bold text-white mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Users</span>
                  <span className="font-medium text-white">{total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Page</span>
                  <span className="font-medium text-white">{current_page}/{last_page}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLeadsDashboard;