// components/NotificationDropdown.js
import React, { useRef } from "react";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "../../features/api/apiSlice"; // Path apne project ke hisaab se
import { 
  FiCheckCircle, 
  FiX, 
  FiInbox, 
  FiBell,
  FiCheck,
  FiTrash2,
  FiAlertCircle
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Custom hook to handle click outside
const useClickOutside = (handler) => {
  const ref = useRef();
  React.useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler]);
  return ref;
};

const formatDate = (dateString) => {
  try {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Just now";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "Just now";
  }
};

const formatFullDate = (dateString) => {
  try {
    if (!dateString) return "Today";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Today";
    return date.toLocaleDateString();
  } catch {
    return "Today";
  }
};

const COLORS = {
  primary: '#6366f1',
  primaryLight: 'rgba(99, 102, 241, 0.2)',
  success: '#10b981',
  danger: '#ef4444',
  textPrimary: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: 'rgba(75, 85, 99, 0.5)',
  bgHover: 'rgba(31, 41, 55, 0.7)',
  bgCard: 'rgba(17, 24, 39, 0.9)',
  bgPrimary: '#111827',
  bgSecondary: '#1f2937'
};

const NotificationDropdown = ({ open, onClose }) => {
  const dropdownRef = useClickOutside(onClose);

  // RTK Query hooks
  const { data, isLoading, isError, error } = useGetNotificationsQuery(open ? undefined : null, {
    skip: !open, // Only fetch if open
  });
  const [markNotificationAsRead, { isLoading: markingOne }] = useMarkNotificationAsReadMutation();
  const [markAllNotificationsAsRead, { isLoading: markingAll }] = useMarkAllNotificationsAsReadMutation();

  // Read/Unread logic
  const notifications = data?.notifications || [];
  const unread = data?.unread_count || 0;

  // Helper for notification "read" state (assume backend manages)
  const isRead = (n) => n.read || false; // If API supports .read, else always false

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 90,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          />

          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "380px",
              maxWidth: "90vw",
              background: COLORS.bgCard,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.1)",
              borderRadius: "12px",
              zIndex: 100,
              overflow: "hidden",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: "16px 20px", 
              borderBottom: `1px solid ${COLORS.border}`, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              background: COLORS.bgPrimary
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: COLORS.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.primary
                }}>
                  <FiBell size={18} />
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    fontSize: "16px", 
                    color: COLORS.textPrimary 
                  }}>
                    Notifications
                  </div>
                  {unread > 0 && (
                    <div style={{ 
                      fontSize: "13px", 
                      color: COLORS.primary,
                      fontWeight: 500
                    }}>
                      {unread} unread {unread === 1 ? "message" : "messages"}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{ 
                  border: "none", 
                  background: "none", 
                  cursor: "pointer",
                  color: COLORS.textSecondary,
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            {isError && (
              <div style={{ 
                padding: "12px 16px", 
                background: "rgba(239, 68, 68, 0.2)",
                color: COLORS.danger,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: `1px solid ${COLORS.border}`
              }}>
                <FiAlertCircle size={16} />
                {error?.message || "Error loading notifications"}
              </div>
            )}

            {isLoading ? (
              <div style={{ 
                padding: "40px", 
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  border: `3px solid ${COLORS.primaryLight}`,
                  borderTopColor: COLORS.primary,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                <div style={{ color: COLORS.textSecondary }}>Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ 
                padding: "32px 24px", 
                color: COLORS.textSecondary, 
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px"
              }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: COLORS.bgSecondary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.textSecondary
                }}>
                  <FiInbox size={28} />
                </div>
                <div style={{ 
                  fontSize: "16px", 
                  fontWeight: 500,
                  color: COLORS.textPrimary
                }}>
                  No notifications yet
                </div>
                <div style={{ fontSize: "14px" }}>
                  We'll notify you when something arrives
                </div>
              </div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: "400px", 
                  overflowY: "auto",
                  scrollbarWidth: "thin"
                }}>
                  <AnimatePresence>
                    {notifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          padding: "16px 20px",
                          borderBottom: `1px solid ${COLORS.border}`,
                          background: isRead(n) ? COLORS.bgPrimary : COLORS.primaryLight,
                          position: "relative",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div style={{ 
                          fontWeight: 600,
                          color: COLORS.textPrimary,
                          marginBottom: "4px"
                        }}>
                          {n.data?.title || "Notification"}
                        </div>
                        <div style={{ 
                          color: COLORS.textSecondary, 
                          fontSize: "14px", 
                          marginBottom: "12px" 
                        }}>
                          {n.data?.message || "No message content"}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          color: COLORS.textSecondary,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span>{formatDate(n.created_at)}</span>
                          <span>•</span>
                          <span>{formatFullDate(n.created_at)}</span>
                        </div>
                        {/* Only show "Mark as Read" if unread */}
                        {(!isRead(n)) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
  console.log('Mark as read:', n.id);
  markNotificationAsRead(n.id);
}}
                            disabled={markingOne}
                            style={{
                              position: "absolute",
                              right: "16px",
                              top: "16px",
                              background: COLORS.primary,
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              fontSize: "12px",
                              padding: "4px 10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontWeight: 500
                            }}
                          >
                            <FiCheck size={14} /> Read
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div style={{ 
                  padding: "12px 16px", 
                  borderTop: `1px solid ${COLORS.border}`, 
                  background: COLORS.bgPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => markAllNotificationsAsRead()}
                    disabled={markingAll || unread === 0}
                    style={{
                      background: "none",
                      border: "none",
                      color: unread === 0 ? COLORS.textSecondary : COLORS.success,
                      cursor: unread === 0 ? "default" : "pointer",
                      fontSize: "14px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      opacity: unread === 0 ? 0.7 : 1
                    }}
                  >
                    <FiCheckCircle size={16} />
                    Mark all as read
                  </motion.button>
                  <div style={{ height: 1 }} /> {/* Placeholder for symmetry */}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
