import React, { useState } from 'react';
import { Calendar, Clock, User, Plus, Lock, Briefcase, ChevronLeft, ChevronRight, Check, X, Filter } from 'lucide-react';

const AdminSchedulerDashboard = () => {
  // Core state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [salespersons, setSalespersons] = useState([
    { id: 1, name: "Ali Khan", schedule: {} },
    { id: 2, name: "Sara Ahmed", schedule: {} }
  ]);
  const [selectedSalesperson, setSelectedSalesperson] = useState(1);
  const [leads, setLeads] = useState([
    { id: 1, name: "Acme Corp", status: "pending", assignedTime: null },
    { id: 2, name: "Globex Inc", status: "pending", assignedTime: null }
  ]);

  // Sample schedule data structure
  const [schedules, setSchedules] = useState({
    1: { // Ali Khan's schedule
      '2023-11-20': [
        {
          id: 1,
          start: '09:00',
          end: '11:00',
          status: 'available',
          lead: null,
          note: 'Morning availability'
        },
        {
          id: 2,
          start: '13:00',
          end: '17:00',
          status: 'available',
          lead: null,
          note: 'Afternoon meetings'
        }
      ]
    },
    2: { // Sara Ahmed's schedule
      '2023-11-20': [
        {
          id: 1,
          start: '10:00',
          end: '12:00',
          status: 'available',
          lead: null,
          note: 'Client calls'
        }
      ]
    }
  });

  // Helper: Add hours to a time string
  function addHours(timeString, hours) {
    const [hh, mm] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hh + hours, mm);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // Helper: Get available slots count for salesperson on the selected day
  function getAvailableSlotsCount(salespersonId) {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const personSchedule = schedules[salespersonId] || {};
    const daySchedule = personSchedule[dateKey] || [];
    return daySchedule.filter(slot => slot.status === 'available' && !slot.lead).length;
  }

  // Helper: Get all slots for salesperson on the selected day
  function getDailySlots(salespersonId, date) {
    const dateKey = date.toISOString().split('T')[0];
    return schedules[salespersonId]?.[dateKey] || [];
  }

  // Find next available slot (2-hour blocks)
  const findNextAvailableSlot = (salespersonId, date) => {
    const dateKey = date.toISOString().split('T')[0];
    const personSchedule = schedules[salespersonId] || {};
    const daySchedule = personSchedule[dateKey] || [];
    
    for (const slot of daySchedule) {
      if (slot.status === 'available' && !slot.lead) {
        const start = new Date(`${dateKey}T${slot.start}:00`);
        const end = new Date(`${dateKey}T${slot.end}:00`);
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        if (durationHours >= 2) {
          return {
            slotId: slot.id,
            startTime: slot.start,
            endTime: addHours(slot.start, 2),
            date: dateKey
          };
        }
      }
    }
    return null;
  };

  // Assign lead to salesperson
  const assignLead = (leadId, salespersonId) => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const nextSlot = findNextAvailableSlot(salespersonId, selectedDate);
    
    if (nextSlot) {
      setSchedules(prev => {
        const updated = { ...prev };
        const slot = updated[salespersonId][dateKey].find(s => s.id === nextSlot.slotId);
        
        // Mark time as booked
        slot.lead = leadId;
        slot.note = `Meeting with ${leads.find(l => l.id === leadId).name}`;
        slot.status = 'booked';
        
        // Create follow-up available slot after 2 hours
        const newAvailableSlot = {
          id: Date.now(),
          start: nextSlot.endTime,
          end: slot.end,
          status: 'available',
          lead: null,
          note: 'Available after meeting'
        };
        
        updated[salespersonId][dateKey] = [
          ...updated[salespersonId][dateKey].filter(s => s.id !== slot.id),
          {
            ...slot,
            end: nextSlot.endTime
          },
          newAvailableSlot
        ].sort((a, b) => a.start.localeCompare(b.start));
        
        return updated;
      });
      
      // Update lead status
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: 'assigned', assignedTime: nextSlot.startTime } 
          : lead
      ));
    }
  };

  // Calendar navigation
  const navigateDate = (days) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + days);
      return newDate;
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          <Briefcase className="inline mr-3" />
          Sales Team Scheduler
        </h1>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-800 px-4 py-2 rounded-lg flex items-center">
            <Calendar className="mr-2 w-5 h-5 text-blue-400" />
            <span>
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sales Team List */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="mr-2" />
            Sales Team
          </h2>
          <div className="space-y-3">
            {salespersons.map(person => (
              <div 
                key={person.id}
                onClick={() => setSelectedSalesperson(person.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedSalesperson === person.id 
                    ? 'bg-blue-900/30 border border-blue-700' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{person.name}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {getAvailableSlotsCount(person.id)} slots available
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Calendar className="mr-2" />
              Availability Calendar
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <ChevronLeft />
              </button>
              <button 
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {getDailySlots(selectedSalesperson, selectedDate).map(slot => (
              <div 
                key={slot.id}
                className={`p-4 rounded-lg border ${
                  slot.status === 'available'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-rose-500/30 bg-rose-500/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-lg">
                      {slot.start} - {slot.end}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {slot.note || (slot.status === 'available' ? 'Available for meetings' : 'Booked')}
                    </div>
                  </div>
                  {slot.lead && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                      {leads.find(l => l.id === slot.lead)?.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Assignment Panel */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Briefcase className="mr-2" />
            Pending Leads
          </h2>
          
          <div className="space-y-3">
            {leads.filter(lead => lead.status === 'pending').map(lead => (
              <div key={lead.id} className="bg-gray-800 rounded-lg p-3">
                <div className="font-medium">{lead.name}</div>
                <div className="flex justify-between items-center mt-2">
                  <button 
                    onClick={() => assignLead(lead.id, selectedSalesperson)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 py-1 rounded text-sm"
                  >
                    Assign
                  </button>
                  <span className="text-xs text-gray-400">
                    {findNextAvailableSlot(selectedSalesperson, selectedDate)?.startTime || 'No slots'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedulerDashboard;
