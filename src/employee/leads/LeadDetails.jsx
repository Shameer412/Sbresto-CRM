import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGetLeadByIdQuery } from "../../features/leads/leadsApiSlice";
import {
  ArrowLeft, Mail, Phone, Calendar, Home, Shield, FileText, 
  Clock, AlertCircle, CheckCircle, Info, ChevronDown, 
  ChevronUp, MapPin, Wrench, CloudRain, Bell, PhoneCall, 
  Mail as MailIcon, User, TrendingUp, DollarSign, Eye,
  Plus, MoreHorizontal, Clipboard, MessageSquare, CheckCircle2,
  XCircle, Clock as ClockIcon, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LeadDetails = () => {
  const { id } = useParams();
  const { data: lead, isLoading, error } = useGetLeadByIdQuery(id);
  const [expandedSections, setExpandedSections] = useState({
    property: true,
    insurance: true,
    damage: true,
    timeline: true,
    notes: true,
    followups: true
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Priority color mapping
  const getPriorityColor = (priority) => {
    const priorityMap = {
      high: "bg-red-900/50 border-red-700",
      medium: "bg-amber-900/50 border-amber-700",
      low: "bg-emerald-900/50 border-emerald-700",
      urgent: "bg-rose-900/50 border-rose-700",
      default: "bg-indigo-900/50 border-indigo-700"
    };
    return priorityMap[(priority || "").toLowerCase()] || priorityMap.default;
  };

  // Status configuration
  const statusConfig = {
    new: { 
      icon: <Info className="text-blue-400" size={16} />, 
      bg: "bg-blue-900/30 border-blue-700", 
      text: "text-blue-300"
    },
    contacted: { 
      icon: <Phone className="text-green-400" size={16} />, 
      bg: "bg-green-900/30 border-green-700", 
      text: "text-green-300" 
    },
    inspection_scheduled: { 
      icon: <Calendar className="text-purple-400" size={16} />, 
      bg: "bg-purple-900/30 border-purple-700", 
      text: "text-purple-300" 
    },
    estimate_sent: { 
      icon: <FileText className="text-cyan-400" size={16} />, 
      bg: "bg-cyan-900/30 border-cyan-700", 
      text: "text-cyan-300" 
    },
    contract_signed: { 
      icon: <CheckCircle className="text-emerald-400" size={16} />, 
      bg: "bg-emerald-900/30 border-emerald-700", 
      text: "text-emerald-300"
    },
    work_in_progress: { 
      icon: <Wrench className="text-orange-400" size={16} />, 
      bg: "bg-orange-900/30 border-orange-700", 
      text: "text-orange-300" 
    },
    completed: { 
      icon: <CheckCircle2 className="text-green-400" size={16} />, 
      bg: "bg-green-900/30 border-green-700", 
      text: "text-green-300" 
    },
    lost: { 
      icon: <XCircle className="text-rose-400" size={16} />, 
      bg: "bg-rose-900/30 border-rose-700", 
      text: "text-rose-300" 
    },
    "in process": { 
      icon: <ClockIcon className="text-indigo-400" size={16} />, 
      bg: "bg-indigo-900/30 border-indigo-700", 
      text: "text-indigo-300" 
    },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    return isNaN(date) ? dateStr : date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) return <LoadingState />;
  if (error || !lead) return <ErrorState />;

  const statusInfo = statusConfig[(lead.status || "").toLowerCase()] || statusConfig.new;

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Eye size={18} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      

    

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Back Button - Desktop */}
        {/* <button 
          onClick={() => window.history.go(-1)}
          className="hidden md:flex items-center gap-2 mb-8 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back to leads</span>
        </button> */}

        {/* Lead Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden mb-8"
        >
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`relative ${getPriorityColor(lead.priority_level)} rounded-xl h-20 w-20 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                  {lead.full_name ? lead.full_name.charAt(0).toUpperCase() : "L"}
                  
                  {/* Status indicator */}
                  <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1 shadow-md border-2 border-gray-800">
                    <div className={`h-4 w-4 rounded-full ${getPriorityColor(lead.priority_level).split(' ')[0]}`} />
                  </div>
                </div>
              </div>

              {/* Lead Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {lead.full_name || "Unnamed Lead"}
                      </h1>
                      <p className="text-gray-400 font-medium">Lead ID: #{lead.id}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold ${statusInfo.bg} ${statusInfo.text} border`}>
                        {statusInfo.icon}
                        {lead.status || "New"}
                      </span>
                      
                      <span className="inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                        <Tag size={14} />
                        {lead.priority_level || "Normal"} Priority
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {lead.phone && (
                      <a 
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
                      >
                        <PhoneCall size={16} />
                        <span className="hidden sm:inline">Call Now</span>
                      </a>
                    )}
                    {lead.email && (
                      <a 
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
                      >
                        <MailIcon size={16} />
                        <span className="hidden sm:inline">Email</span>
                      </a>
                    )}
                    <button className="p-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm hover:bg-gray-600 transition-colors">
                      <MoreHorizontal size={18} className="text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <InfoPill 
                    icon={<MapPin size={16} className="text-blue-400" />}
                    label="Location"
                    value={lead.property_address?.split(',')[0] || "N/A"}
                  />
                  <InfoPill 
                    icon={<DollarSign size={16} className="text-emerald-400" />}
                    label="Est. Value"
                    value={formatCurrency(lead.estimated_value)}
                  />
                  <InfoPill 
                    icon={<Calendar size={16} className="text-purple-400" />}
                    label="Created"
                    value={formatDate(lead.created_at)}
                  />
                </div>

                {/* Contact Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
                  {lead.phone && (
                    <a 
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors text-sm"
                    >
                      <Phone size={16} />
                      <span>{lead.phone}</span>
                    </a>
                  )}
                  {lead.email && (
                    <a 
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors text-sm"
                    >
                      <Mail size={16} />
                      <span>{lead.email}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock size={16} />
                    <span>Last contact: {formatDate(lead.last_contacted_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:block mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-1">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Details */}
              <SectionCard 
                icon={<Home size={18} className="text-blue-400" />}
                title="Property Details"
                expanded={expandedSections.property}
                onToggle={() => toggleSection('property')}
              >
                <InfoRow label="Full Address" value={lead.property_address} />
                <InfoRow label="Zip Code" value={lead.zip_code} />
                <InfoRow label="Roof Type" value={lead.type_of_roof} />
                <InfoRow label="Roof Age" value={lead.age_of_roof ? `${lead.age_of_roof} years` : "Unknown"} />
              </SectionCard>

              {/* Insurance Info */}
              <SectionCard 
                icon={<Shield size={18} className="text-green-400" />}
                title="Insurance Information"
                expanded={expandedSections.insurance}
                onToggle={() => toggleSection('insurance')}
              >
                <InfoRow label="Provider" value={lead.insurance_provider} />
                <InfoRow label="Claim Number" value={lead.claim_number} />
                <InfoRow label="Insured Party" value={lead.insured} />
                <InfoRow label="Retail Bid" value={lead.retail_bid_request} />
              </SectionCard>

              {/* Damage Details */}
              <SectionCard 
                icon={<CloudRain size={18} className="text-orange-400" />}
                title="Damage Assessment"
                expanded={expandedSections.damage}
                onToggle={() => toggleSection('damage')}
              >
                <InfoRow label="Damage Type" value={lead.damage_type} />
                <InfoRow label="Storm Date" value={formatDate(lead.storm_date)} />
                <InfoRow label="Severity" value={lead.damage_severity || "Not specified"} />
              </SectionCard>

              {/* Timeline */}
              <SectionCard 
                icon={<Clock size={18} className="text-purple-400" />}
                title="Important Dates"
                expanded={expandedSections.timeline}
                onToggle={() => toggleSection('timeline')}
              >
                <InfoRow label="Inspection Date" value={formatDate(lead.inspection_date)} />
                <InfoRow label="Follow Up Date" value={formatDate(lead.follow_up_date)} />
                <InfoRow label="Last Contact" value={formatDate(lead.last_contacted_at)} />
              </SectionCard>
            </div>
          )}

          {/* Notes Section */}
          <SectionCard 
            icon={<MessageSquare size={18} className="text-blue-400" />}
            title={`Communication Notes (${lead.notes?.length || 0})`}
            expanded={expandedSections.notes}
            onToggle={() => toggleSection('notes')}
          >
            {lead.notes?.length > 0 ? (
              <div className="space-y-4">
                {lead.notes.map(note => (
                  <motion.div 
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-700 rounded-xl p-4 hover:border-blue-700/50 transition-colors bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-700 border border-gray-600">
                          <User size={16} className="text-blue-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">Agent #{note.sender_id}</span>
                          <p className="text-xs text-gray-400">{formatDate(note.created_at)}</p>
                        </div>
                      </div>
                      <button className="p-1 rounded-md hover:bg-gray-700 transition-colors">
                        <MoreHorizontal size={16} className="text-gray-400" />
                      </button>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{note.message}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Clipboard size={24} className="text-gray-500" />} 
                title="No communication notes yet"
                description="Start building your conversation history with this lead"
                actionText="Add Note"
                onAction={() => console.log("Add note clicked")}
              />
            )}
          </SectionCard>
          {/* Follow Ups Section */}
          <SectionCard 
            icon={<Bell size={18} className="text-green-400" />}
            title={`Follow Up Schedule (${lead.follow_ups?.length || 0})`}
            expanded={expandedSections.followups}
            onToggle={() => toggleSection('followups')}
          >
            {lead.follow_ups?.length > 0 ? (
              <div className="space-y-4">
                {lead.follow_ups.map(fu => (
                  <motion.div 
                    key={fu.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-700 rounded-xl p-4 hover:border-green-700/50 transition-colors bg-gray-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-700 border border-gray-600">
                          <Calendar size={16} className="text-green-400" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-white">{formatDate(fu.follow_up_date)}</span>
                          <p className="text-xs text-gray-400">Scheduled follow-up</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        fu.status === 'completed' 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {fu.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{fu.note || "No additional notes"}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Bell size={24} className="text-gray-500" />} 
                title="No follow-ups scheduled"
                description="Schedule your next interaction to keep this lead warm"
                actionText="Schedule Follow-up"
                onAction={() => console.log("Schedule follow-up clicked")}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const InfoPill = ({ icon, label, value }) => (
  <div className="p-3 rounded-lg bg-gray-800 border border-gray-700 transition-all hover:border-gray-600">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gray-700">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const SectionCard = ({ icon, title, children, expanded, onToggle }) => (
  <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-700">
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="p-1 rounded-md hover:bg-gray-700 transition-colors">
        {expanded ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </div>
    </button>
    {expanded && (
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="px-4 pb-4"
      >
        <div className="space-y-3">
          {children}
        </div>
      </motion.div>
    )}
  </div>
);

const InfoRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-gray-700/30 transition-colors">
    <div className="flex items-center gap-3">
      {icon && (
        <div className="p-1 rounded-md bg-gray-700">
          {icon}
        </div>
      )}
      <span className="text-sm text-gray-400 font-medium">{label}</span>
    </div>
    <span className="text-sm font-semibold text-white text-right max-w-[60%] truncate">
      {value || "N/A"}
    </span>
  </div>
);

const EmptyState = ({ icon, title, description, actionText, onAction }) => (
  <div className="text-center py-8">
    <div className="mx-auto h-12 w-12 text-gray-500 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">{description}</p>
    <button 
      onClick={onAction}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
    >
      <Plus size={16} />
      {actionText}
    </button>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-blue-900 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" 
          style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}></div>
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-lg font-semibold text-white">Loading lead details...</p>
        <p className="text-sm text-gray-400">Please wait while we fetch the information</p>
      </div>
      
      {/* Loading skeleton */}
      <div className="mt-8 max-w-md mx-auto space-y-3">
        <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  </div>
);

const ErrorState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center max-w-lg p-6 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
      <div className="relative">
        <AlertCircle size={48} className="text-red-500 mx-auto" />
        <div className="absolute inset-0 h-12 w-12 rounded-full bg-red-900/30 blur-xl mx-auto"></div>
      </div>
      
      <div className="mt-6 space-y-3">
        <h3 className="text-xl font-bold text-white">Lead Not Found</h3>
        <p className="text-gray-400 leading-relaxed">
          The requested lead could not be loaded. This might be due to an invalid ID or network issues.
        </p>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
       
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 border border-gray-600 hover:bg-gray-600 rounded-lg text-sm font-medium text-white transition-colors shadow-sm"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default LeadDetails;