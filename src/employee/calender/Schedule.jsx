import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Calendar, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useSetLeadScheduleMutation } from "../../features/calender/scheduleApiSlice";

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const ScheduleTab = () => {
  const [schedules, setSchedules] = useState({});
  const [activeDay, setActiveDay] = useState('monday');
  const [setLeadSchedule, { isLoading, isSuccess, error }] = useSetLeadScheduleMutation();

  useEffect(() => {
    const initialSchedules = {};
    DAYS.forEach(day => {
      initialSchedules[day.key] = [];
    });
    setSchedules(initialSchedules);
  }, []);

  const addTimeSlot = (day) => {
    setSchedules(prev => ({
      ...prev,
      [day]: [
        ...prev[day],
        {
          id: Date.now(),
          start_time: '09:00',
          end_time: '10:00'
        }
      ]
    }));
  };

  const removeTimeSlot = (day, slotId) => {
    setSchedules(prev => ({
      ...prev,
      [day]: prev[day].filter(slot => slot.id !== slotId)
    }));
  };

  const updateTimeSlot = (day, slotId, field, value) => {
    setSchedules(prev => ({
      ...prev,
      [day]: prev[day].map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSubmit = async () => {
    const formattedSchedules = [];
    Object.entries(schedules).forEach(([day, slots]) => {
      slots.forEach(slot => {
        formattedSchedules.push({
          day_of_week: DAYS.find(d => d.key === day)?.label,
          start_time: slot.start_time,
          end_time: slot.end_time
        });
      });
    });

    try {
      await setLeadSchedule(formattedSchedules).unwrap();
    } catch (err) {
      console.error('Failed to save schedule:', err);
    }
  };

  const getTotalHours = (day) => {
    const slots = schedules[day] || [];
    return slots.reduce((total, slot) => {
      const start = new Date(`2024-01-01T${slot.start_time}`);
      const end = new Date(`2024-01-01T${slot.end_time}`);
      const hours = (end - start) / (1000 * 60 * 60);
      return total + Math.max(0, hours);
    }, 0).toFixed(1);
  };

  const getWeeklyTotal = () => {
    return DAYS.reduce((total, day) => total + parseFloat(getTotalHours(day.key)), 0).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Day Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
                <span>Days</span>
              </h2>
              <div className="space-y-2">
                {DAYS.map(day => (
                  <button
                    key={day.key}
                    onClick={() => setActiveDay(day.key)}
                    className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${
                      activeDay === day.key
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{day.short}</span>
                    <span className="text-sm opacity-80">
                      {getTotalHours(day.key)}h
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Weekly Total</span>
                  <span className="text-indigo-600 font-bold">{getWeeklyTotal()}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Editor */}
          <div className="lg:col-span-3">
            <div className="bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                  {DAYS.find(d => d.key === activeDay)?.label} Schedule
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={() => addTimeSlot(activeDay)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm font-medium ${
                      isLoading
                        ? 'bg-indigo-400 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                {schedules[activeDay]?.length === 0 ? (
                  <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>No time slots scheduled</p>
                    <button
                      onClick={() => addTimeSlot(activeDay)}
                      className="mt-3 font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      + Add first slot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {schedules[activeDay]?.map((slot) => (
                      <div key={slot.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateTimeSlot(activeDay, slot.id, 'start_time', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateTimeSlot(activeDay, slot.id, 'end_time', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">
                              Duration
                            </label>
                            <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700">
                              {(() => {
                                const start = new Date(`2024-01-01T${slot.start_time}`);
                                const end = new Date(`2024-01-01T${slot.end_time}`);
                                const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
                                return `${hours.toFixed(1)} hours`;
                              })()}
                            </div>
                          </div>

                          <div className="md:col-span-2 flex items-center justify-end gap-2">
                            <button
                              onClick={() => removeTimeSlot(activeDay, slot.id)}
                              className="p-2 rounded-lg transition-colors duration-200 text-red-500 hover:bg-gray-100"
                              title="Remove time slot"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Messages */}
                {isSuccess && (
                  <div className="mt-4 p-3 rounded-lg flex items-center bg-green-100 text-green-800 border border-green-300">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <span className="font-medium">Schedule updated successfully!</span>
                  </div>
                )}

                {error && (
                  <div className="mt-4 p-3 rounded-lg flex items-center bg-red-100 text-red-800 border border-red-300">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    <span className="font-medium">
                      {error?.data?.message || 'Error updating schedule. Please try again.'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Overview */}
            <div className="mt-6 bg-gray-50 rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Weekly Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {DAYS.map(day => (
                  <div
                    key={day.key}
                    onClick={() => setActiveDay(day.key)}
                    className={`text-center p-3 rounded-lg cursor-pointer transition-colors ${
                      activeDay === day.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="text-sm font-medium">{day.short}</div>
                    <div className={`text-lg font-bold mt-1 ${
                      activeDay === day.key ? 'text-white' : 'text-indigo-600'
                    }`}>
                      {getTotalHours(day.key)}h
                    </div>
                    <div className={`text-xs mt-1 ${
                      activeDay === day.key ? 'text-indigo-100' : 'text-gray-500'
                    }`}>
                      {schedules[day.key]?.length || 0} slots
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTab;
