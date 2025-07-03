import React, { useState } from "react";
import { useSetLeadScheduleMutation } from "../features/calender/scheduleApiSlice";

// Days of the week options
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const ScheduleSetter = () => {
  const [schedules, setSchedules] = useState([
    { day_of_week: "Monday", start_time: "10:00", end_time: "11:00" }
  ]);
  const [setSchedule, { isLoading, isSuccess, error }] = useSetLeadScheduleMutation();

  // Handle changes to schedule slot fields
  const handleChange = (idx, field, value) => {
    setSchedules(prev =>
      prev.map((slot, i) =>
        i === idx ? { ...slot, [field]: value } : slot
      )
    );
  };

  // Add a new empty schedule slot
  const addSlot = () =>
    setSchedules(prev => [
      ...prev,
      { day_of_week: "Monday", start_time: "09:00", end_time: "10:00" }
    ]);

  // Remove a schedule slot
  const removeSlot = idx =>
    setSchedules(prev => prev.filter((_, i) => i !== idx));

  // Submit handler
  const handleSubmit = async e => {
    e.preventDefault();
    await setSchedule(schedules);
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", border: "1px solid #eee", borderRadius: 8, padding: 24 }}>
      <h2>Set Lead Schedule</h2>
      <form onSubmit={handleSubmit}>
        {schedules.map((slot, idx) => (
          <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <select
              value={slot.day_of_week}
              onChange={e => handleChange(idx, "day_of_week", e.target.value)}
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input
              type="time"
              value={slot.start_time}
              onChange={e => handleChange(idx, "start_time", e.target.value)}
              required
            />
            <span>to</span>
            <input
              type="time"
              value={slot.end_time}
              onChange={e => handleChange(idx, "end_time", e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => removeSlot(idx)}
              disabled={schedules.length === 1}
              style={{ color: "red" }}
              title="Remove slot"
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={addSlot} style={{ marginBottom: 12 }}>
          + Add Slot
        </button>
        <br />
        <button type="submit" disabled={isLoading} style={{ minWidth: 120 }}>
          {isLoading ? "Saving..." : "Set Schedule"}
        </button>
      </form>
      {isSuccess && <p style={{ color: "green", marginTop: 16 }}>Schedule updated successfully!</p>}
      {error && (
        <p style={{ color: "red", marginTop: 16 }}>
          {error?.data?.message || "Error updating schedule."}
        </p>
      )}
    </div>
  );
};

export default ScheduleSetter;
