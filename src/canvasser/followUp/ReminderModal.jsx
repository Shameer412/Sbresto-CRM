import React, { useState, useEffect } from 'react';
import './Reminder.css';
import { useCreateFollowUpMutation } from '../../features/leads/leadsApiSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReminderModal = ({ leadId, onClose, onSuccess }) => {
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [minDate, setMinDate] = useState('');

  const [createFollowUp, { isLoading }] = useCreateFollowUpMutation();

  useEffect(() => {
    // Set minimum date to tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMinDate(tomorrow.toISOString().split('T')[0]);

    if (!leadId) {
      toast.error('No lead selected for reminder.');
      onClose?.();
    }
  }, [leadId, onClose]);

  const handleSubmit = async () => {
    if (!note || !followUpDate) {
      toast.warn('Please fill in all fields.', { position: 'top-right' });
      return;
    }
    if (!leadId) {
      toast.error('Invalid lead. Cannot create follow-up.', { position: 'top-right' });
      return;
    }

    // Validate date is in the future
    const selectedDate = new Date(followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate <= today) {
      toast.warn('Please select a future date for follow-up.', { position: 'top-right' });
      return;
    }

    try {
      await createFollowUp({
        note,
        follow_up_date: followUpDate,
        status,
        lead_id: leadId
      }).unwrap();
      toast.success('Follow-up created successfully.', { position: 'top-right' });
      onSuccess?.();
      onClose();
      setNote('');
      setFollowUpDate('');
      setStatus('pending');
    } catch (error) {
      toast.error(error?.data?.message || error.toString(), { position: 'top-right' });
    }
  };

  const getStatusIcon = (statusValue) => {
    switch (statusValue) {
      case 'pending':
        return (
          <svg className="rm-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        );
      case 'completed':
        return (
          <svg className="rm-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        );
      case 'rescheduled':
        return (
          <svg className="rm-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rm-modal-backdrop">
      <div className="rm-modal-container">
        {/* Header */}
        <div className="rm-modal-header">
          <div className="rm-header-accent-bar"></div>
          <div className="rm-header-content">
            <div className="rm-header-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div>
              <h2 className="rm-modal-title">Schedule Follow-Up</h2>
              <p className="rm-modal-subtitle">
                Plan your next interaction
                {leadId && (
                  <span className="rm-lead-id-badge">
                    Lead ID: <span className="rm-lead-id-value">{leadId}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <button 
            className="rm-close-button" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="rm-modal-body">
          {/* Note Field */}
          <div className="rm-form-group">
            <label className="rm-input-label">
              <svg className="rm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Notes
            </label>
            <textarea 
              className="rm-text-input rm-textarea"
              value={note} 
              onChange={e => setNote(e.target.value)}
              placeholder="Enter follow-up details..."
              rows="4"
              disabled={isLoading}
            />
          </div>

          {/* Follow-Up Date Field */}
          <div className="rm-form-group">
            <label className="rm-input-label">
              <svg className="rm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Follow-Up Date
            </label>
            <input 
              type="date" 
              className="rm-text-input"
              value={followUpDate} 
              min={minDate}
              onChange={e => setFollowUpDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Status Field */}
          <div className="rm-form-group">
            <label className="rm-input-label">
              <svg className="rm-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
              Status
            </label>
            <div className="rm-select-wrapper">
              <select 
                className={`rm-select-input rm-status-${status}`}
                value={status} 
                onChange={e => setStatus(e.target.value)}
                disabled={isLoading}
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
              <div className="rm-select-icon">
                {getStatusIcon(status)}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rm-modal-footer">
          <button 
            className="rm-button rm-secondary-button" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="rm-button rm-primary-button" 
            onClick={handleSubmit} 
            disabled={isLoading || !leadId}
          >
            {isLoading && (
              <svg className="rm-button-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
            )}
            {isLoading ? 'Saving...' : 'Schedule Follow-Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;