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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 transition-colors p-1.5 rounded-full hover:bg-gray-100"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-blue-600 p-5 border-b border-blue-700">
          <h3 className="text-xl font-semibold text-white">
            Schedule Follow-Up
          </h3>
          {leadId && (
            <p className="text-sm text-blue-100 mt-1">
              Lead ID: <span className="font-medium text-white">{leadId}</span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Salesperson */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiUser className="mr-2 text-blue-600" /> Salesperson
            </label>
            <select
              name="saleMan"
              className={`w-full px-4 py-3 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                formErrors.saleMan 
                  ? 'bg-red-50 border-red-500 text-gray-900' 
                  : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
              value={formData.saleMan}
              onChange={handleChange}
              disabled={loadingUsers || isSubmitting}
            >
              <option value="" className="bg-white">Select Salesperson</option>
              {salesUsers.map((user) => (
                <option key={user.id} value={user.id} className="bg-white">
                  {user.name}
                </option>
              ))}
            </select>
            {formErrors.saleMan && (
              <p className="mt-2 text-xs text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.saleMan}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiCalendar className="mr-2 text-blue-600" /> Follow-Up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              className={`w-full px-4 py-3 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                formErrors.followUpDate 
                  ? 'bg-red-50 border-red-500 text-gray-900' 
                  : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
              value={formData.followUpDate}
              min={minDateString}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {formErrors.followUpDate && (
              <p className="mt-2 text-xs text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.followUpDate}
              </p>
            )}
          </div>

          {/* Time Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiClock className="mr-2 text-blue-600" /> Time Slot
            </label>
            
            {fetchingSlots && (
              <div className="flex items-center justify-center p-4 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-300">
                <FiRefreshCw className="animate-spin mr-2 text-blue-600" /> Loading available slots...
              </div>
            )}
            
            {!fetchingSlots && formData.saleMan && formData.followUpDate && slots.length === 0 && (
              <div className="p-4 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-300">
                No available slots for selected date
              </div>
            )}
            
            {!fetchingSlots && slots.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                      formData.slotId === slot.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700 hover:bg-blue-50'
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
              <p className="mt-2 text-xs text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.slotId}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FiEdit2 className="mr-2 text-blue-600" /> Notes
            </label>
            <textarea
              name="note"
              className={`w-full px-4 py-3 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                formErrors.note 
                  ? 'bg-red-50 border-red-500 text-gray-900' 
                  : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
              }`}
              rows={3}
              value={formData.note}
              onChange={handleChange}
              placeholder="Enter follow-up details..."
              disabled={isSubmitting}
            />
            {formErrors.note && (
              <p className="mt-2 text-xs text-red-600 flex items-center">
                <FiInfo className="mr-1" /> {formErrors.note}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              className={`w-full px-4 py-3 text-sm rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
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
          <div className="flex justify-end pt-2 space-x-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 transition-all shadow-sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all flex items-center justify-center min-w-[120px] shadow-sm"
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