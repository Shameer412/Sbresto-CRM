import React, { useState } from 'react';
import {
  useGetLeadsQuery,
  useDeleteLeadMutation,
} from '../../features/leads/leadsApiSlice';
import ReminderModal from '../followUp/ReminderModal';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Mail, Filter, Eye, Search,
  ChevronDown, ChevronUp, Activity, AlertCircle,
  Plus, Star, CircleDot, Clock, Bell, CheckCircle,
  Trash2, Edit, RefreshCw, MessageCircle,
} from 'lucide-react';
import './Leads.css';
import FollowUpNotes from "../notes/Notes"

const PRIORITY_OPTIONS = ['all', 'high', 'medium', 'low', 'urgent'];

const getOptionValue = (option) => option;
const getOptionLabel = (option) => option.charAt(0).toUpperCase() + option.slice(1);

const FilterGroup = ({
  label, options, selected, setSelected,
}) => (
  <div className="ld-filter-group">
    <label>{label}</label>
    <div className="ld-filter-options">
      {options.map(option => {
        const value = getOptionValue(option);
        const labelTxt = getOptionLabel(option);
        return (
          <button
            key={value}
            className={`ld-filter-option ${selected === value ? 'ld-active' : ''}`}
            onClick={() => setSelected(value)}
          >
            {labelTxt}
            {label === 'Priority' && value !== 'all' && (
              <Star size={14} fill={value === 'high' || value === 'medium' ? 'currentColor' : 'none'} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ------- UPDATED LeadCard --------------
const LeadCard = ({
  lead, onView, onEdit, onDelete, onShowNotes, onReminder
}) => {
  const getPriorityColor = () => {
    switch (lead.priority_level?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#94a3b8';
    }
  };
  return (
    <div className={`ld-lead-card ld-${lead.priority_level?.toLowerCase()}`}>
      <div className="ld-id-badge" style={{ backgroundColor: getPriorityColor() }}>
        {lead.id || 'N/A'}
      </div>
      <div className="ld-card-header">
        <div className="ld-avatar-container">
          <div
            className="ld-lead-avatar"
            style={{
              background: `linear-gradient(135deg, ${getPriorityColor()} 0%, #1e293b 100%)`,
              boxShadow: `0 2px 8px ${getPriorityColor()}80`
            }}
          >
            {lead.full_name ? lead.full_name.charAt(0).toUpperCase() : 'L'}
          </div>
          <div className="ld-lead-basic-info">
            <h3>{lead.full_name || 'Unnamed Lead'}</h3>
            <p className="ld-lead-date">{new Date(lead.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <div className="ld-card-content">
        <div className="ld-detail-row">
          <div className="ld-detail-icon-container">
            <Mail size={16} className="ld-detail-icon" />
          </div>
          <p className="ld-detail-value">{lead.email || 'Email not provided'}</p>
        </div>
        <div className="ld-detail-row">
          <div className="ld-detail-icon-container">
            <Phone size={16} className="ld-detail-icon" />
          </div>
          <p className="ld-detail-value">{lead.phone || 'Phone not provided'}</p>
        </div>
      </div>
      <div className="ld-card-footer">
        <div className="ld-priority-indicator">
          {lead.priority_level === 'high' && <Star size={16} fill="currentColor" />}
          {lead.priority_level === 'medium' && <Star size={16} fill="currentColor" />}
          {lead.priority_level === 'low' && <Star size={16} />}
          <span>{lead.priority_level || 'No priority'}</span>
        </div>
      <div className="ld-action-buttons">
  <button className="action-btn view" onClick={() => onView(lead)}>
    <Eye size={16} />
  </button>
  <button className="action-btn edit" onClick={() => onEdit(lead)}>
    <Edit size={16} />
  </button>
  <button className="action-btn delete" onClick={() => onDelete(lead)}>
    <Trash2 size={16} />
  </button>

 <button className="action-btn followup" onClick={() => onShowNotes(lead)}>
  <div className="ld-icon-badge-wrapper">
    <MessageCircle size={16} />
    {lead.notes_count > 0 && (
      <div className="ld-icon-badge">{lead.notes_count}</div>
    )}
  </div>
</button>

<button className="action-btn reminder" onClick={() => onReminder(lead)}>
  <div className="ld-icon-badge-wrapper">
    <Bell size={16} />
    {lead.follow_ups_count > 0 && (
      <div className="ld-icon-badge">{lead.follow_ups_count}</div>
    )}
  </div>
</button>

</div>

      </div>
    </div>
  );
};
// ------------ END LeadCard -------------


const LeadsDashboard = ( { setActiveTab }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [reminderModalLeadId, setReminderModalLeadId] = useState(null);
  const [notesLeadId, setNotesLeadId] = useState(null);

  const navigate = useNavigate();
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();

  // *** RTK Query for fetching leads with filter and page ***
  const filterParam = searchTerm.trim() !== '' ? searchTerm : undefined;
  const { data, isLoading, isError, error, refetch } = useGetLeadsQuery({
    page,
    filter: filterParam
  });

  // Leads data: data?.data (pagination structure)
  const leads = (data?.data ?? []).filter(lead =>
    selectedPriority === 'all' || (lead.priority_level?.toLowerCase() === selectedPriority)
  );
  const totalPages = data?.last_page || 1;
console.log('LEADS:', data?.data);

  // Action Handlers
 const handleAddLead = () => {
  setActiveTab('addLead');  
};

  // *** UPDATED handler: go to /leaddetails/:id instead of /leads/:id ***
  const handleViewLead = (lead) => navigate(`/leads/${lead.id}`);
  const handleEditLead = (lead) => navigate(`/leads/${lead.id}/edit`);
   const handleForm = () => navigate(`/leads/add`);
  const handleDeleteLead = async (lead) => {
    if (window.confirm(`Are you sure you want to delete ${lead.full_name || 'this lead'}?`)) {
      try {
        await deleteLead(lead.id).unwrap();
        refetch(); // Reload after delete
      } catch (err) {
        alert(err?.toString() || 'Failed to delete lead.');
      }
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="ld-dashboard ld-dark-mode">
        <div className="ld-loading-container">
          <Activity className="ld-animate-spin" size={48} />
          <p>Loading your leads...</p>
        </div>
      </div>
    );
  }
  // Error
  if (isError) {
    return (
      <div className="ld-dashboard ld-dark-mode">
        <div className="ld-error-container">
          <div className="ld-error-card">
            <AlertCircle size={48} className="ld-error-icon" />
            <h3>Error Loading Data</h3>
            <p>{error?.message || 'Unknown error'}</p>
            <button onClick={refetch}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="ld-dashboard ld-dark-mode">
      <div className="ld-main-container">
        <main className="ld-content">
          <div className="ld-leads-header">
            <h1>Lead Management</h1>
            <p>{leads.length} {leads.length === 1 ? 'lead' : 'leads'} found</p>
          </div>

          <div className="ld-search-section">
            <div className="ld-search-container">
              <Search size={18} className="ld-search-icon" />
              <input
                type="text"
                placeholder="Search leads by name, email, or address..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to page 1 on new search
                }}
              />
            </div>
            <div className="ld-filter-container">
              <button
                className="ld-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                <span>Filters</span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button className="ld-add-lead-btn" onClick={handleForm}>
                <Plus size={16} />
                <span>Add Lead</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="ld-expanded-filters">
              <FilterGroup
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={selectedPriority}
                setSelected={setSelectedPriority}
              />
            </div>
          )}

          {leads.length === 0 ? (
            <div className="ld-empty-state">
              <div className="ld-empty-illustration">
                <div className="ld-illustration-circle"></div>
                <div className="ld-illustration-line"></div>
              </div>
              <h3>No Leads Found</h3>
              <p>No leads match your current filters. Try adjusting your search or filters.</p>
              <button className="ld-primary-btn" onClick={handleAddLead}>
                <Plus size={16} /> Add Lead
              </button>
            </div>
          ) : (
            <div className="ld-leads-grid">
              {leads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onView={handleViewLead}   
                  onEdit={handleEditLead}
                  onDelete={handleDeleteLead}
                  onShowNotes={() => setNotesLeadId(lead.id)}
                  onReminder={() => setReminderModalLeadId(lead.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="ld-pagination-container">
            <div className="ld-pagination-info">
              Showing page {page} of {totalPages} • {data?.total || 0} total leads
            </div>
            <div className="ld-pagination-buttons">
              <button
                className="ld-pagination-btn ld-pagination-prev"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                First
              </button>
              <button
                className="ld-pagination-btn ld-pagination-prev"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              {/* Dynamic page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`ld-pagination-btn ${page === pageNum ? 'ld-pagination-active' : ''}`}
                    onClick={() => setPage(pageNum)}
                    disabled={page === pageNum}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {totalPages > 5 && page < totalPages - 2 && (
                <span className="ld-pagination-ellipsis">...</span>
              )}

              {totalPages > 5 && page < totalPages - 2 && (
                <button
                  className={`ld-pagination-btn ${page === totalPages ? 'ld-pagination-active' : ''}`}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}

              <button
                className="ld-pagination-btn ld-pagination-next"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
              <button
                className="ld-pagination-btn ld-pagination-next"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Last
              </button>
            </div>

            {reminderModalLeadId && (
              <ReminderModal
                leadId={reminderModalLeadId}
                onClose={() => setReminderModalLeadId(null)}
                onSuccess={() => {
                  setReminderModalLeadId(null);

                }}
              />
            )}
            {notesLeadId && (
              <FollowUpNotes
                leadId={notesLeadId}
                onClose={() => setNotesLeadId(null)}
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default LeadsDashboard;
