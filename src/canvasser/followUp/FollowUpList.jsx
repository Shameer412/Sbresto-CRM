import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  useGetFollowUpsQuery,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
} from "../../features/leads/leadsApiSlice";
import { 
  Edit, Trash2, Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp, NotebookText, User
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FollowUpList.css";

const FollowUpList = () => {
  const userId = useSelector((state) => state.auth?.user?.id);
  const { data: apiResponse = {}, isLoading, refetch } = useGetFollowUpsQuery(userId, {
    skip: !userId,
  });
  const followUps = apiResponse.data ?? [];

  const [updateFollowUp, { isLoading: updating }] = useUpdateFollowUpMutation();
  const [deleteFollowUp, { isLoading: deleting }] = useDeleteFollowUpMutation();

  const [editId, setEditId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editFields, setEditFields] = useState({
    status: "pending",
    note: "",
    follow_up_date: "",
  });

  const startEdit = (fu) => {
    setEditId(fu.id);
    setEditFields({
      status: fu.status || "pending",
      note: fu.note || "",
      follow_up_date: fu.follow_up_date ? fu.follow_up_date.slice(0, 10) : "",
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditFields({ status: "pending", note: "", follow_up_date: "" });
  };

  const saveEdit = async (id) => {
    try {
      await updateFollowUp({ followUpId: id, ...editFields }).unwrap();
      toast.success("Follow-up updated successfully!");
      setEditId(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this follow-up?")) return;
    try {
      await deleteFollowUp(id).unwrap();
      toast.success("Follow-up deleted successfully!");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Delete failed");
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed": return "status-completed";
      case "pending": return "status-pending";
      case "rescheduled": return "status-rescheduled";
      default: return "status-default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="follow-up-container">
      <div className="follow-up-header">
        <h2 className="follow-up-title">Follow Up Management</h2>
      </div>

      {isLoading ? (
        <div className="follow-up-loading">
          <div className="loading-spinner"></div>
        </div>
      ) : followUps.length > 0 ? (
        <div className="follow-up-grid">
          {followUps.map(fu => (
            <div key={fu.id} className="follow-up-card">
              {editId === fu.id ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editFields.status}
                      onChange={(e) => setEditFields({...editFields, status: e.target.value})}
                      disabled={updating}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="rescheduled">Rescheduled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Note</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={editFields.note}
                      onChange={(e) => setEditFields({...editFields, note: e.target.value})}
                      placeholder="Enter notes about this follow-up"
                      disabled={updating}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Follow Up Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={editFields.follow_up_date}
                      onChange={(e) => setEditFields({...editFields, follow_up_date: e.target.value})}
                      disabled={updating}
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      className="action-button cancel-button"
                      onClick={cancelEdit}
                      disabled={updating}
                    >
                      <XCircle className="button-icon" /> Cancel
                    </button>
                    <button 
                      className="action-button save-button"
                      onClick={() => saveEdit(fu.id)}
                      disabled={updating}
                    >
                      <CheckCircle className="button-icon" /> {updating ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="card-header" 
                    onClick={() => toggleExpand(fu.id)}
                  >
                    <div className="card-header-content">
                      <div className="card-header-row">
                        <span className="lead-id">
                          <User size={14} className="inline mr-1" /> Lead#{fu.lead_id || "N/A"}
                        </span>
                        <span className={`status-badge ${getStatusColor(fu.status)}`}>
                          {fu.status || "N/A"}
                        </span>
                      </div>
                      <span className="follow-up-date">
                        <Calendar className="icon" size={14} />
                        {formatDate(fu.follow_up_date)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="note-section">
                      <div className="note-label">
                        <NotebookText size={14} /> Notes
                      </div>
                      <div className="note-text">
                        {fu.note || "No notes available for this follow-up."}
                      </div>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        className="action-button edit-button" 
                        onClick={() => startEdit(fu)}
                      >
                        <Edit className="button-icon" /> Edit
                      </button>
                      <button 
                        className="action-button delete-button" 
                        onClick={() => handleDelete(fu.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="button-icon" /> {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="follow-up-empty">
          <div className="empty-icon">
            <NotebookText size={48} />
          </div>
          <p>No follow-ups found</p>
          <p className="text-sm mt-2">Create a new follow-up to get started</p>
        </div>
      )}
    </div>
  );
};

export default FollowUpList;