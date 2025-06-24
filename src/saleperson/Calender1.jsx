import React, { useState, useEffect } from 'react';
import { Plus, Clock, User, Save, X, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, StickyNote, Tag, Filter, Hourglass, Check } from 'lucide-react';

const EnhancedCalendarSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [showFilters, setShowFilters] = useState(false);
  const [hourlyBreakdown, setHourlyBreakdown] = useState([]);
  
  // Slot form state
  const [slotData, setSlotData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    availableHours: 1,
    status: 'free',
    note: '',
    tags: [],
    hourlyDetails: {}
  });

  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    dateRange: 'all'
  });

  // Sample schedule data with enhanced slot structure
  const [scheduleSlots, setScheduleSlots] = useState({
    '2025-06-23': [
      {
        id: 1,
        startTime: '09:00',
        endTime: '12:00',
        availableHours: 3,
        status: 'free',
        note: 'Morning availability for client calls',
        tags: ['client-calls', 'high-priority'],
        hourlyDetails: {
          '09:00-10:00': { note: 'Client onboarding', tags: ['new-client'] },
          '10:00-11:00': { note: 'Product demo', tags: ['demo'] },
          '11:00-12:00': { note: 'Follow-up calls', tags: ['follow-up'] }
        }
      },
      {
        id: 2,
        startTime: '14:00',
        endTime: '17:00',
        availableHours: 3,
        status: 'available',
        note: 'Afternoon meetings',
        tags: ['meetings'],
        hourlyDetails: {
          '14:00-15:00': { note: 'Team sync', tags: ['internal'] },
          '15:00-16:00': { note: 'Sales presentation', tags: ['presentation'] },
          '16:00-17:00': { note: 'Strategy planning', tags: ['planning'] }
        }
      }
    ],
    '2025-06-24': [
      {
        id: 3,
        startTime: '10:00',
        endTime: '15:00',
        availableHours: 5,
        status: 'busy',
        note: 'Conference day - limited availability',
        tags: ['conference', 'busy'],
        hourlyDetails: {
          '10:00-11:00': { note: 'Keynote speech', tags: ['keynote'] },
          '11:00-12:00': { note: 'Networking', tags: ['networking'] },
          '12:00-13:00': { note: 'Lunch break', tags: ['break'] },
          '13:00-14:00': { note: 'Workshop', tags: ['workshop'] },
          '14:00-15:00': { note: 'Panel discussion', tags: ['panel'] }
        }
      }
    ]
  });

  // Updated UI colors
  const statusColors = {
    free: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    available: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    busy: 'bg-rose-500/10 border-rose-500/30 text-rose-400'
  };

  const statusOptions = [
    { value: 'free', label: 'Free', color: 'emerald' },
    { value: 'available', label: 'Available', color: 'blue' },
    { value: 'busy', label: 'Busy', color: 'rose' }
  ];

  const tagColors = [
    'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'bg-teal-500/10 text-teal-400 border border-teal-500/20'
  ];

  // Reusable function for hourly breakdown calculation
  const calculateHourlySlots = (startTime, endTime, existingDetails = {}) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const slots = [];
    
    let current = new Date(start);
    while (current < end) {
      let nextHour = new Date(current);
      nextHour.setHours(nextHour.getHours() + 1);
      
      if (nextHour > end) nextHour = new Date(end);
      
      const startStr = current.toTimeString().substring(0, 5);
      const endStr = nextHour.toTimeString().substring(0, 5);
      const slotKey = `${startStr}-${endStr}`;
      
      slots.push({
        time: slotKey,
        note: existingDetails[slotKey]?.note || '',
        tags: existingDetails[slotKey]?.tags || []
      });
      
      current = nextHour;
    }
    
    return slots;
  };

  // Generate hourly breakdown when slot times change
  useEffect(() => {
    if (slotData.startTime && slotData.endTime) {
      const hours = calculateAvailableHours(slotData.startTime, slotData.endTime);
      setSlotData(prev => ({ ...prev, availableHours: hours }));
      
      const slots = calculateHourlySlots(slotData.startTime, slotData.endTime, slotData.hourlyDetails);
      setHourlyBreakdown(slots);
    }
  }, [slotData.startTime, slotData.endTime]);

  const calculateAvailableHours = (start, end) => {
    const startDate = new Date(`2000-01-01 ${start}`);
    const endDate = new Date(`2000-01-01 ${end}`);
    return Math.round((endDate - startDate) / (1000 * 60 * 60) * 10) / 10;
  };

  const handleAddSlot = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const newSlot = {
      ...slotData,
      id: Date.now(),
      availableHours: calculateAvailableHours(slotData.startTime, slotData.endTime),
      hourlyDetails: hourlyBreakdown.reduce((acc, hour) => {
        if (hour.note || hour.tags.length > 0) {
          acc[hour.time] = { note: hour.note, tags: hour.tags };
        }
        return acc;
      }, {})
    };

    if (editingSlot) {
      setScheduleSlots(prev => ({
        ...prev,
        [dateKey]: prev[dateKey]?.map(slot => 
          slot.id === editingSlot.id ? newSlot : slot
        ) || [newSlot]
      }));
    } else {
      setScheduleSlots(prev => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || []), newSlot]
      }));
    }

    resetModal();
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingSlot(null);
    setSlotData({
      startTime: '09:00',
      endTime: '10:00',
      availableHours: 1,
      status: 'free',
      note: '',
      tags: [],
      hourlyDetails: {}
    });
    setHourlyBreakdown([]);
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotData(slot);
    const slots = calculateHourlySlots(slot.startTime, slot.endTime, slot.hourlyDetails);
    setHourlyBreakdown(slots);
  };

  const handleDeleteSlot = (slotId) => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    setScheduleSlots(prev => ({
      ...prev,
      [dateKey]: prev[dateKey]?.filter(slot => slot.id !== slotId) || []
    }));
  };

  const addTag = (tag, hourIndex = null) => {
    if (hourIndex !== null) {
      const updatedBreakdown = [...hourlyBreakdown];
      if (!updatedBreakdown[hourIndex].tags.includes(tag)) {
        updatedBreakdown[hourIndex].tags = [...updatedBreakdown[hourIndex].tags, tag];
      }
      setHourlyBreakdown(updatedBreakdown);
    } else {
      if (tag && !slotData.tags.includes(tag)) {
        setSlotData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
      }
    }
  };

  const removeTag = (tagToRemove, hourIndex = null) => {
    if (hourIndex !== null) {
      const updatedBreakdown = [...hourlyBreakdown];
      updatedBreakdown[hourIndex].tags = updatedBreakdown[hourIndex].tags.filter(tag => tag !== tagToRemove);
      setHourlyBreakdown(updatedBreakdown);
    } else {
      setSlotData(prev => ({
        ...prev,
        tags: prev.tags.filter(tag => tag !== tagToRemove)
      }));
    }
  };

  const updateHourlyNote = (hourIndex, note) => {
    const updatedBreakdown = [...hourlyBreakdown];
    updatedBreakdown[hourIndex].note = note;
    setHourlyBreakdown(updatedBreakdown);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getSlotsByDate = (date) => {
    if (!date) return [];
    const dateKey = formatDate(date);
    return scheduleSlots[dateKey] || [];
  };

  const getTotalHoursForDate = (date) => {
    const slots = getSlotsByDate(date);
    return slots.reduce((total, slot) => total + slot.availableHours, 0);
  };

  const navigateMonth = (direction) => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const filteredSlots = getSlotsByDate(selectedDate).filter(slot => {
    if (filterOptions.status !== 'all' && slot.status !== filterOptions.status) {
      return false;
    }
    return true;
  });

  const monthDays = getDaysInMonth(selectedDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-6">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-800 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Enhanced Schedule Manager
              </h1>
              <p className="text-gray-400 text-sm">Manage your availability with detailed breakdowns</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center space-x-2 transition-colors border border-gray-700"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slot</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compact Calendar */}
        <div className="lg:col-span-1 bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-800 shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-center text-gray-400 font-medium">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1.5">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => (
              <div
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`
                  p-1.5 rounded-lg cursor-pointer transition-all duration-200 relative
                  ${!date ? 'invisible' : ''}
                  ${isToday(date) ? 'ring-2 ring-blue-500/50' : ''}
                  ${isSelectedDate(date) ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-gray-800'}
                  ${date && getSlotsByDate(date).length > 0 ? 'border border-emerald-500/30' : ''}
                  flex flex-col items-center
                `}
              >
                {date && (
                  <>
                    <div className={`text-sm ${
                      isSelectedDate(date) ? 'font-bold text-white' : 
                      date.getDay() === 0 || date.getDay() === 6 ? 'text-gray-400' : 'text-white'
                    }`}>
                      {date.getDate()}
                    </div>
                    {getSlotsByDate(date).length > 0 && (
                      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Selected Date Summary */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h3>
            <div className="flex justify-between items-center text-xs bg-gray-800/50 rounded-lg p-2">
              <span className="text-gray-400">
                {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''}
              </span>
              <span className="text-emerald-400 font-medium">
                {getTotalHoursForDate(selectedDate)}h available
              </span>
            </div>
          </div>
        </div>

        {/* Slot Details */}
        <div className="lg:col-span-2 bg-gray-900/80 backdrop-blur-md rounded-2xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <div className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
              {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter Options
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterOptions(prev => ({ ...prev, status: 'all' }))}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        filterOptions.status === 'all' 
                          ? 'bg-gray-700 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                    {statusOptions.map(status => (
                      <button
                        key={status.value}
                        onClick={() => setFilterOptions(prev => ({ ...prev, status: status.value }))}
                        className={`px-3 py-1 rounded-full text-xs transition-colors ${
                          filterOptions.status === status.value 
                            ? `bg-${status.color}-500/20 text-${status.color}-400 border border-${status.color}-500/30` 
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {filteredSlots.length > 0 ? (
              filteredSlots.map(slot => (
                <div
                  key={slot.id}
                  className={`p-5 rounded-xl border transition-all duration-200 ${statusColors[slot.status]} shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-lg">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-400">
                        {slot.availableHours}h available
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-1.5 hover:bg-rose-600/20 rounded-lg transition-colors text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {slot.note && (
                    <div className="mb-3 text-sm text-gray-300 flex items-start space-x-2 bg-gray-800/30 p-3 rounded-lg">
                      <StickyNote className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{slot.note}</span>
                    </div>
                  )}

                  {slot.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {slot.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={`px-2.5 py-1 rounded-full text-xs ${tagColors[index % tagColors.length]}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Hourly Breakdown */}
                  {Object.keys(slot.hourlyDetails).length > 0 && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <h4 className="text-xs font-medium text-gray-400 mb-3 flex items-center">
                        <Hourglass className="w-4 h-4 mr-2" /> Hourly Breakdown
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(slot.hourlyDetails).map(([time, details]) => (
                          <div key={time} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700 text-sm">
                            <div className="font-medium text-gray-300 mb-1">{time}</div>
                            {details.note && (
                              <div className="text-xs text-gray-400 mb-2">{details.note}</div>
                            )}
                            {details.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {details.tags.map((tag, index) => (
                                  <span
                                    key={tag}
                                    className={`px-2 py-0.5 rounded-full text-[0.65rem] ${tagColors[index % tagColors.length]}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No slots for this date</p>
                <p className="text-sm mb-4">Add a time slot to manage your availability</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-white px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-sm font-medium transition-all shadow-md"
                >
                  <Plus className="w-4 h-4 inline mr-2 text-white" />
                  Add Time Slot
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Modal with Hourly Breakdown */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl p-6 w-full max-w-3xl border border-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
              </h3>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div>
                {/* Date Display */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <div className="bg-gray-800/50 rounded-xl p-3 text-white border border-gray-700">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={slotData.startTime}
                      onChange={(e) => setSlotData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">End Time</label>
                    <input
                      type="time"
                      value={slotData.endTime}
                      onChange={(e) => setSlotData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                {/* Available Hours Display */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Total Available Hours</label>
                  <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 font-medium flex items-center justify-between">
                    <span>{slotData.availableHours} hour{slotData.availableHours !== 1 ? 's' : ''}</span>
                    <div className="flex space-x-1">
                      {hourlyBreakdown.map((hour, index) => (
                        <div 
                          key={index} 
                          className="w-2 h-2 rounded-full bg-emerald-500"
                          title={`${hour.time}\n${hour.note || 'No notes'}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {statusOptions.map(status => (
                      <button
                        key={status.value}
                        onClick={() => setSlotData(prev => ({ ...prev, status: status.value }))}
                        className={`p-3 rounded-xl border transition-all ${
                          slotData.status === status.value
                            ? statusColors[status.value] + ' ring-1 ring-offset-2 ring-offset-gray-900 ring-opacity-70'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* General Note */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-400 mb-2">General Note</label>
                  <textarea
                    value={slotData.note}
                    onChange={(e) => setSlotData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Add a general note about this time slot..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                  />
                </div>

                {/* General Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">General Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {slotData.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-300 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tag and press Enter"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Hourly Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-4 flex items-center">
                  <Hourglass className="w-5 h-5 mr-2" /> Hourly Breakdown
                </h4>
                
                {hourlyBreakdown.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {hourlyBreakdown.map((hour, index) => (
                      <div key={index} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                        <div className="font-medium mb-3 text-gray-300">{hour.time}</div>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Note</label>
                          <input
                            type="text"
                            value={hour.note}
                            onChange={(e) => updateHourlyNote(index, e.target.value)}
                            placeholder="Add note for this hour..."
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {hour.tags.map((tag, tagIndex) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded-full text-xs ${tagColors[tagIndex % tagColors.length]} flex items-center`}
                              >
                                {tag}
                                <button
                                  onClick={() => removeTag(tag, index)}
                                  className="ml-1 hover:text-red-300"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add tag and press Enter"
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTag(e.target.value.trim(), index);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-600">
                    <Clock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                    <p>Set start and end times to see hourly breakdown</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={resetModal}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 px-4 rounded-xl font-medium transition-all duration-300 border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSlot}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-md flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                {editingSlot ? 'Update Slot' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCalendarSchedule;