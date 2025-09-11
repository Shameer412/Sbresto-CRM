import React, { useState, useEffect } from 'react';
import { useGetLeadsQuery, useDeleteLeadMutation } from '../../features/leads/leadsApiSlice';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Phone, Mail, Search, Plus, Edit, Trash2, MessageCircle, Flame, ArrowUp, ChevronsRight, Minus, 
    FolderSearch, Loader2, LayoutGrid, List, CheckCircle, Radio, Clock, MoreHorizontal, ChevronLeft, ChevronRight, Users, TrendingUp
} from 'lucide-react';

// --- CONFIGURATION & MOCK DATA ---
const priorityConfig = {
    urgent: { label: 'Urgent', icon: Flame, tag: 'bg-rose-100 text-rose-700' },
    high: { label: 'High', icon: ArrowUp, tag: 'bg-amber-100 text-amber-700' },
    medium: { label: 'Medium', icon: ChevronsRight, tag: 'bg-sky-100 text-sky-700' },
    low: { label: 'Low', icon: Minus, tag: 'bg-emerald-100 text-emerald-700' },
};
const STATUS_COLUMNS = {
    new: { id: 'new', title: 'New Leads' },
    contacted: { id: 'contacted', title: 'Contacted' },
    qualified: { id: 'qualified', title: 'Qualified' },
};
const getLeadStatus = (leadId) => Object.keys(STATUS_COLUMNS)[leadId % Object.keys(STATUS_COLUMNS).length];

// --- DASHBOARD HEADER ---
const DashboardHeader = ({ leads, onAddLead }) => {
    const chartData = Object.values(priorityConfig).map(p => ({
        name: p.label,
        count: leads.filter(l => l.priority_level === p.label.toLowerCase()).length
    }));

    return (
        <header className="mb-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Leads Dashboard</h1>
                    <p className="mt-1 text-slate-500">Welcome back! Here's your current sales pipeline status.</p>
                </div>
                <button onClick={onAddLead} className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 active:scale-95 transition-transform">
                    <Plus size={18} /> Add Lead
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Total Leads</p>
                        <Users size={20} className="text-slate-400" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{leads.length}</p>
                </div>
                 <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">Urgent Leads</p>
                        <Flame size={20} className="text-rose-500" />
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{chartData.find(d=>d.name==='Urgent')?.count || 0}</p>
                </div>
                <div className="md:col-span-2 p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500 mb-2">Leads by Priority</p>
                    <ResponsiveContainer width="100%" height={80}>
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px'}}/>
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </header>
    );
};

// --- KANBAN VIEW COMPONENTS ---
const KanbanCard = ({ lead }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const priority = priorityConfig[lead.priority_level?.toLowerCase()];
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm touch-none">
            <div className={`inline-flex items-center gap-1.5 font-semibold rounded-full text-xs px-2 py-0.5 mb-2 ${priority.tag}`}><priority.icon size={12} />{priority.label}</div>
            <p className="font-semibold text-slate-800 mb-2">{lead.full_name}</p>
            <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/>{new Date(lead.created_at).toLocaleDateString()}</p>
                <img src={`https://i.pravatar.cc/24?u=${lead.email}`} alt="avatar" className="w-6 h-6 rounded-full"/>
            </div>
        </div>
    );
};
const KanbanColumn = ({ title, leads }) => (
    <div className="flex-1 bg-slate-100/70 p-3 rounded-xl">
        <h3 className="font-semibold text-slate-700 px-1 mb-4">{title} <span className="text-sm text-slate-500">{leads.length}</span></h3>
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
                {leads.map(lead => <KanbanCard key={lead.id} lead={lead} />)}
            </div>
        </SortableContext>
    </div>
);
const KanbanView = ({ leadsByStatus, onDragEnd }) => (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="flex gap-6">
            {Object.values(STATUS_COLUMNS).map(col => (
                <KanbanColumn key={col.id} title={col.title} leads={leadsByStatus[col.id] || []} />
            ))}
        </div>
    </DndContext>
);

// --- LIST VIEW & PAGINATION ---
const ListView = ({ leads }) => { /* ... similar to previous list view ... */ };
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-center items-center gap-2 mt-8">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 flex items-center gap-1"><ChevronLeft size={16}/> Previous</button>
        <span className="px-4 py-2 text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-100 flex items-center gap-1">Next <ChevronRight size={16}/></button>
    </div>
);

// --- MAIN DASHBOARD ---
const LeadsDashboard = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('kanban');
    const [leads, setLeads] = useState([]);
    const [leadsByStatus, setLeadsByStatus] = useState({});
    
    // RTK Query Fetching
    const { data: apiData, isLoading } = useGetLeadsQuery({});

    // Populate local state once data is fetched
    useEffect(() => {
        if (apiData?.data) {
            const initialLeads = apiData.data.map(lead => ({
                ...lead,
                status: getLeadStatus(lead.id) // Assign mock status
            }));
            setLeads(initialLeads);
        }
    }, [apiData]);

    // Group leads for Kanban view whenever local leads state changes
    useEffect(() => {
        const grouped = leads.reduce((acc, lead) => {
            const status = lead.status || 'new';
            if (!acc[status]) acc[status] = [];
            acc[status].push(lead);
            return acc;
        }, {});
        setLeadsByStatus(grouped);
    }, [leads]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeLeadId = active.id;
        const overColumnId = over.id;
        
        // Find which column the lead was in
        const activeColumnId = leads.find(l => l.id === activeLeadId)?.status;

        if (activeColumnId !== overColumnId) {
            setLeads(prev => prev.map(lead => 
                lead.id === activeLeadId ? { ...lead, status: overColumnId } : lead
            ));
        }
    };
    
    if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    <DashboardHeader leads={leads} onAddLead={() => navigate('/leadlist/add')} />
                    
                    {/* View Controls */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center bg-slate-200/80 rounded-lg p-1">
                            <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'kanban' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}><LayoutGrid size={16}/>Board</button>
                            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}><List size={16}/>List</button>
                        </div>
                        {/* Filters could go here */}
                    </div>

                    {/* Content Views */}
                    {view === 'kanban' && <KanbanView leadsByStatus={leadsByStatus} onDragEnd={handleDragEnd} />}
                    {view === 'list' && (
                        <>
                           {/* Replace this with your existing ListView component, passing a paginated slice of `leads` */}
                           <div className="bg-white p-4 rounded-xl border border-slate-200">List view and pagination would go here.</div>
                           <Pagination currentPage={1} totalPages={10} onPageChange={()=>{}} />
                        </>
                    )}
                </div>

                {/* Right Sidebar */}
                <aside className="lg:col-span-1">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sticky top-8">
                        <h3 className="font-semibold text-slate-800 mb-4">Activity Feed</h3>
                        <div className="space-y-4">
                            {/* Placeholder for activity items */}
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle size={20} className="text-emerald-600"/></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">You qualified "TechCorp Inc."</p>
                                    <p className="text-xs text-slate-500">12 minutes ago</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center"><MessageCircle size={20} className="text-sky-600"/></div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Note added to "Innovate LLC"</p>
                                    <p className="text-xs text-slate-500">45 minutes ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LeadsDashboard;