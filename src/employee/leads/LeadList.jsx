import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetLeadsQuery, useDeleteLeadMutation } from '../../features/leads/leadsApiSlice'; // Assuming this path is correct

// Lucide React Icons
import {
  Phone, Mail, Filter, Eye, Search, ChevronDown, ChevronUp, Activity,
  AlertCircle, Plus, Star, Trash2, Edit, RefreshCw, MessageCircle, Bell
} from 'lucide-react';

// Import your other components
import ReminderModal from '../followup/ReminderModel';
import FollowUpNotes from "../notes/Notes";

// A helper object to map priority levels to Tailwind CSS classes
// This is the standard way to handle dynamic classes in Tailwind
const priorityStyles = {
  default: {
    border: 'border-slate-400',
    bg: 'bg-slate-400',
    text: 'text-slate-800',
    tagBg: 'bg-slate-100',
  },
  low: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-800',
    tagBg: 'bg-emerald-100',
  },
  medium: {
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-800',
    tagBg: 'bg-amber-100',
  },
  high: {
    border: 'border-red-500',
    bg: 'bg-red-500',
    text: 'text-red-800',
    tagBg: 'bg-red-100',
  },
  urgent: {
    border: 'border-rose-600',
    bg: 'bg-rose-600',
    text: 'text-rose-800',
    tagBg: 'bg-rose-100',
  },
};

const PRIORITY_OPTIONS = ['all', 'high', 'medium', 'low', 'urgent'];

// ===================================================================
//  LEAD CARD COMPONENT (with Tailwind CSS)
// ===================================================================
const LeadCard = ({ lead, onView, onEdit, onDelete, onShowNotes, onReminder }) => {
  const styles = priorityStyles[lead.priority_level?.toLowerCase()] || priorityStyles.default;

  return (
    <div className="relative bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-400">
      {/* Priority Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.bg}`}></div>

      <div className="p-5">
        <div className="flex justify-between items-start">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold ${styles.bg}`}>
              {lead.full_name ? lead.full_name.charAt(0).toUpperCase() : 'L'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{lead.full_name || 'Unnamed Lead'}</h3>
              <p className="text-xs text-slate-500">Added on: {new Date(lead.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          {/* ID Badge */}
          <div className={`px-2 py-0.5 text-xs font-semibold text-white rounded-full ${styles.bg}`}>
            ID: {lead.id || 'N/A'}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-600">
            <Mail size={16} className="text-slate-400" />
            <span>{lead.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Phone size={16} className="text-slate-400" />
            <span>{lead.phone || 'No phone provided'}</span>
          </div>
        </div>

        {/* Footer: Priority Tag & Actions */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
          <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${styles.tagBg} ${styles.text}`}>
            {lead.priority_level || 'No Priority'}
          </span>

          <div className="flex items-center gap-1">
            {[
              { icon: Eye, action: () => onView(lead), tooltip: 'View' },
              { icon: Edit, action: () => onEdit(lead), tooltip: 'Edit' },
              { icon: MessageCircle, action: () => onShowNotes(lead), tooltip: 'Notes', count: lead.notes_count },
              { icon: Bell, action: () => onReminder(lead), tooltip: 'Reminder', count: lead.follow_ups_count },
              { icon: Trash2, action: () => onDelete(lead), tooltip: 'Delete', danger: true },
            ].map((btn, index) => (
              <button
                key={index}
                onClick={btn.action}
                title={btn.tooltip}
                className={`relative p-2 rounded-full transition-colors ${btn.danger ? 'hover:bg-red-100 hover:text-red-600' : 'hover:bg-blue-50 hover:text-blue-600'} text-slate-500`}
              >
                <btn.icon size={18} />
                {btn.count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {btn.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================================
//  MAIN DASHBOARD COMPONENT (with Tailwind CSS)
// ===================================================================
const LeadsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [reminderModalLeadId, setReminderModalLeadId] = useState(null);
  const [notesLeadId, setNotesLeadId] = useState(null);

  const navigate = useNavigate();
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
  const { data, isLoading, isError, error, refetch } = useGetLeadsQuery({ page, filter: searchTerm.trim() || undefined });

  const leads = (data?.data ?? []).filter(lead =>
    selectedPriority === 'all' || (lead.priority_level?.toLowerCase() === selectedPriority)
  );
  const totalPages = data?.last_page || 1;

  const handleDeleteLead = async (lead) => {
    if (window.confirm(`Are you sure you want to delete ${lead.full_name || 'this lead'}?`)) {
      try {
        await deleteLead(lead.id).unwrap();
        refetch();
      } catch (err) {
        console.error('Failed to delete lead:', err);
        alert('Failed to delete lead.');
      }
    }
  };

  // RENDER STATES (Loading, Error)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-slate-600">
        <Activity className="animate-spin text-blue-500" size={48} />
        <p className="mt-4 text-lg">Loading your leads...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center border border-slate-200">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h3 className="mt-4 text-2xl font-bold text-slate-800">Error Loading Data</h3>
          <p className="mt-2 text-slate-500">{error?.toString() || 'An unknown error occurred'}</p>
          <button onClick={refetch} className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="bg-white min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Lead Management</h1>
            <p className="mt-1 text-slate-500">Showing {leads.length} of {data?.total || 0} leads found</p>
          </div>
          <button onClick={() => navigate('/employee/leadlist/add')} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus size={18} /> Add New Lead
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative w-full md:flex-grow">
            <Search size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 shadow-sm">
            <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
                <label className="font-semibold text-slate-600">Priority:</label>
                <div className="flex items-center gap-2 flex-wrap">
                {PRIORITY_OPTIONS.map(option => (
                    <button
                        key={option}
                        onClick={() => setSelectedPriority(option)}
                        className={`px-3 py-1 text-sm font-medium rounded-full capitalize border transition-colors ${selectedPriority === option ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                    >
                        {option}
                    </button>
                ))}
                </div>
            </div>
          </div>
        )}

        {/* Leads Grid or Empty State */}
        {leads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onView={(l) => navigate(`/employee/leadlist/${l.id}`)}
                onEdit={(l) => navigate(`/employee/leadlist/${l.id}/edit`)}
                onDelete={handleDeleteLead}
                onShowNotes={(l) => setNotesLeadId(l.id)}
                onReminder={(l) => setReminderModalLeadId(l.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white border-2 border-dashed border-slate-300 rounded-xl p-12">
              <Search size={48} className="mx-auto text-slate-400" />
              <h3 className="mt-4 text-xl font-bold text-slate-800">No Leads Found</h3>
              <p className="mt-2 text-slate-500">Try adjusting your search or filters, or add a new lead.</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-600">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                    <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 text-sm font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
                </div>
            </div>
        )}
      </main>

      {/* Modals */}
      {reminderModalLeadId && <ReminderModal leadId={reminderModalLeadId} onClose={() => setReminderModalLeadId(null)} onSuccess={() => setReminderModalLeadId(null)} />}
      {notesLeadId && <FollowUpNotes leadId={notesLeadId} onClose={() => setNotesLeadId(null)} />}
    </div>
  );
};

export default LeadsDashboard;