import React, { useState } from 'react';
import { useGetLeadUsersQuery } from '../../features/leads/leadsApiSlice';
import {
  useGetAvailableLeadSlotsQuery,
  useBookLeadMeetingMutation
} from '../../features/calender/scheduleApiSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ScheduleMeeting = () => {
  // 1. Get users (with role field if available)
  const { data: users, isLoading: loadingUsers } = useGetLeadUsersQuery();
  const usersArray = users?.data?.data || [];

  const salesUsers = usersArray; // Use all until "role" available

  // 2. UI State
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 3. Query available slots
  const leadId = selectedUser?.id;
  const formattedDate = selectedDate ? selectedDate.toISOString().slice(0, 10) : null;
  const { data: slotData, isLoading: loadingSlots } = useGetAvailableLeadSlotsQuery(
    leadId && formattedDate ? { leadId, date: formattedDate } : skipToken
  );
  const slots = slotData?.available_slots || [];

  // 4. Booking mutation
  const [bookMeeting, { isLoading: booking }] = useBookLeadMeetingMutation();

  // Trim seconds
  const trimTime = (time) => time ? time.slice(0, 5) : '';

  // Handler to book meeting (now auto-fallbacks to selected date)
  const handleBook = async (slot) => {
    if (!leadId || !(slot.date || formattedDate)) return;
    try {
      await bookMeeting({
        leadId,
        date: slot.date || formattedDate,
        start_time: trimTime(slot.start_time),
        end_time: trimTime(slot.end_time),
      }).unwrap();
      alert('Meeting booked successfully!');
    } catch (err) {
      alert('Error booking meeting: ' + (err?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 p-6 bg-zinc-900 rounded-2xl shadow-lg text-zinc-100">
      <h2 className="text-xl font-bold mb-2">Schedule a Meeting with Salesperson</h2>

      {/* Step 1: Salesperson Dropdown */}
      <div>
        <label className="block mb-1 text-zinc-300">Select Salesperson:</label>
        {loadingUsers ? (
          <div>Loading users...</div>
        ) : (
          <select
            className="border border-zinc-700 bg-zinc-800 rounded p-2 w-full text-zinc-100"
            value={selectedUser?.id || ''}
            onChange={e => {
              const user = salesUsers.find(u => u.id === Number(e.target.value));
              setSelectedUser(user || null);
              setSelectedDate(null);
            }}
          >
            <option value="">Choose...</option>
            {salesUsers.length === 0 && (
              <option disabled>No salespersons found</option>
            )}
            {salesUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2: Date Picker */}
      {selectedUser && (
        <div>
          <label className="block mb-1 text-zinc-300">Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            className="border border-zinc-700 bg-zinc-800 rounded p-2 w-full text-zinc-100"
            placeholderText="Pick a date"
            dateFormat="yyyy-MM-dd"
            calendarClassName="!bg-zinc-900 !text-zinc-100"
          />
        </div>
      )}

      {/* Step 3: Show available slots */}
      {selectedUser && selectedDate && (
        <div>
          <label className="block mb-1 text-zinc-300">Available Slots:</label>
          {loadingSlots ? (
            <div>Loading slots...</div>
          ) : slots.length === 0 ? (
            <div>No slots available for this date.</div>
          ) : (
            <ul className="space-y-2">
              {slots.map((slot, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between border border-zinc-700 bg-zinc-800 rounded p-2"
                >
                  <span>
                    {trimTime(slot.start_time)} - {trimTime(slot.end_time)}
                  </span>
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800 transition"
                    onClick={() => handleBook(slot)}
                    disabled={booking}
                  >
                    Book
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleMeeting;
