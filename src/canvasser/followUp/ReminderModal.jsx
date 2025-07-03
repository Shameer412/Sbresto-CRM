import React, { useState, useEffect } from 'react';
import { useGetLeadUsersQuery, useCreateFollowUpMutation } from '../../features/leads/leadsApiSlice';
import { useGetAvailableLeadSlotsQuery } from '../../features/calender/scheduleApiSlice';
import { skipToken } from '@reduxjs/toolkit/query';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiEdit2, 
  FiX, 
  FiCheck, 
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi';

const ReminderModal = ({ leadId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    note: '',
    followUpDate: '',
    status: 'pending',
    saleMan: '',
    slotId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Users from leads slice
  const { data: usersData, isLoading: loadingUsers } = useGetLeadUsersQuery();
  const salesUsers = usersData?.data?.data || [];

  // Slots from calendar slice
  const { data: slotsData, isLoading: loadingSlots, isFetching: fetchingSlots } = 
    useGetAvailableLeadSlotsQuery(
      formData.saleMan && formData.followUpDate ? 
        { leadId: formData.saleMan, date: formData.followUpDate } : 
        skipToken
    );
  const slots = slotsData?.available_slots || [];

  // Create follow-up from leads slice
  const [createFollowUp] = useCreateFollowUpMutation();

  // Calculate min date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  // Reset slot when salesman or date changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, slotId: '' }));
  }, [formData.saleMan, formData.followUpDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.note) errors.note = 'Note is required';
    if (!formData.followUpDate) errors.followUpDate = 'Date is required';
    if (!formData.saleMan) errors.saleMan = 'Salesperson is required';
    if (!formData.slotId) errors.slotId = 'Time slot is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await createFollowUp({
        note: formData.note,
        follow_up_date: formData.followUpDate,
        status: formData.status,
        lead_id: leadId,
        sale_man: formData.saleMan,
        slot: formData.slotId
      }).unwrap();
      
      toast.success('Follow-up scheduled successfully!');
      onSuccess?.();
      onClose?.();
      resetForm();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to schedule follow-up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      note: '',
      followUpDate: '',
      status: 'pending',
      saleMan: '',
      slotId: ''
    });
    setFormErrors({});
  };

  const getStatusColor = () => {
    switch(formData.status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rescheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatSlotTime = (slot) => {
    const start = slot.start_time?.slice(0, 5) || '';
    const end = slot.end_time?.slice(0, 5) || '';
    return `${start} - ${end}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-10 text-gray-300 hover:text-white transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">
            Schedule Follow-Up
          </h3>
          {leadId && (
            <p className="text-xs text-gray-400 mt-1">
              Lead ID: <span className="font-medium text-gray-300">{leadId}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Salesperson */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiUser className="mr-2" /> Salesperson
            </label>
            <select
              name="saleMan"
              className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                formErrors.saleMan 
                  ? 'bg-gray-700 border-red-500 text-white' 
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
              value={formData.saleMan}
              onChange={handleChange}
              disabled={loadingUsers || isSubmitting}
            >
              <option value="" className="bg-gray-800">Select Salesperson</option>
              {salesUsers.map((user) => (
                <option key={user.id} value={user.id} className="bg-gray-800">
                  {user.name}
                </option>
              ))}
            </select>
            {formErrors.saleMan && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.saleMan}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiCalendar className="mr-2" /> Follow-Up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                formErrors.followUpDate 
                  ? 'bg-gray-700 border-red-500 text-white' 
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
              value={formData.followUpDate}
              min={minDateString}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {formErrors.followUpDate && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.followUpDate}
              </p>
            )}
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiClock className="mr-2" /> Time Slot
            </label>
            
            {fetchingSlots && (
              <div className="flex items-center justify-center p-3 text-sm text-gray-400 bg-gray-700 rounded-lg border border-gray-600">
                <FiRefreshCw className="animate-spin mr-2" /> Loading available slots...
              </div>
            )}
            
            {!fetchingSlots && formData.saleMan && formData.followUpDate && slots.length === 0 && (
              <div className="p-3 text-sm text-gray-400 bg-gray-700 rounded-lg border border-gray-600">
                No available slots for selected date
              </div>
            )}
            
            {!fetchingSlots && slots.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`p-2 text-sm rounded-lg border transition-all ${
                      formData.slotId === slot.id
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                    }`}
                    onClick={() => handleChange({ target: { name: 'slotId', value: slot.id }})}
                    disabled={isSubmitting}
                  >
                    {formatSlotTime(slot)}
                  </button>
                ))}
              </div>
            )}
            {formErrors.slotId && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.slotId}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
              <FiEdit2 className="mr-2" /> Notes
            </label>
            <textarea
              name="note"
              className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                formErrors.note 
                  ? 'bg-gray-700 border-red-500 text-white' 
                  : 'bg-gray-700 border-gray-600 text-white'
              }`}
              rows={3}
              value={formData.note}
              onChange={handleChange}
              placeholder="Enter follow-up details..."
              disabled={isSubmitting}
            />
            {formErrors.note && (
              <p className="mt-1 text-xs text-red-400 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.note}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              className={`w-full px-3 py-2 text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                getStatusColor()
              }`}
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="pending" className="bg-amber-100 text-amber-800">Pending</option>
              <option value="completed" className="bg-emerald-100 text-emerald-800">Completed</option>
              <option value="rescheduled" className="bg-blue-100 text-blue-800">Rescheduled</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-all flex items-center justify-center min-w-[100px]"
              disabled={isSubmitting || !leadId}
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" /> Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;