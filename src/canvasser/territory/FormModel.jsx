// LeadFormModal.jsx
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import {
  FiUser, FiMail, FiPhone, FiHome, FiMapPin, FiAlertTriangle,
  FiShield, FiClipboard, FiStar, FiUsers, FiFileText,
  FiChevronDown, FiCalendar, FiCheck, FiArrowRight, FiArrowLeft, FiX
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
;

// Leads API
import {
  useGetLeadStatusesQuery,
  useGetLeadSourcesQuery,
  useGetLeadUsersQuery,
  useCreateLeadMutation,
} from '../../features/leads/leadsApiSlice';

// Calendar API (ScheduleMeeting.jsx compatible)
import { skipToken } from '@reduxjs/toolkit/query';
import {
  useGetAvailableLeadSlotsQuery,
  useBookLeadMeetingMutation,
} from '../../features/calender/scheduleApiSlice';

const damageTypeOptions = ['Roof', 'Siding', 'Windows', 'Flood', 'Other'];
const priorityLevelOptions = ['Low', 'Medium', 'High', 'Urgent'];
const insuredOptions = ['Yes', 'No'];

/** Local date -> YYYY-MM-DD (no UTC shift) */
const formatLocalYMD = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
};
const trimTime = (t) => (t ? t.slice(0, 5) : '');

// --------- NEW: helper to prefill from house ---------
const nameFromHouse = (h) => {
  const parts = [h?.first_name, h?.last_name].filter(Boolean);
  // fallback to email/user if no first/last
  if (parts.length) return parts.join(' ');
  return '';
};
const zipFromAddress = (addr) => {
  // naive pickup of last 5 consecutive digits (US ZIP). Safe fallback if none.
  if (!addr) return '';
  const m = addr.match(/(\d{5})(-\d{4})?$/);
  return m ? m[0] : '';
};

export default function FormModel({
  open,
  onClose,
  house,          // { id, first_name, last_name, email, phone, address, city, state, ... }
  teritoryId,     // number (itinerary/territory id) — note spelling kept per your API
}) {
  // -------- options + mutations ----------
  const { data: statusResp } = useGetLeadStatusesQuery(undefined, { skip: !open });
  const statusOptions = statusResp?.data || [];

  const { data: sourceResp } = useGetLeadSourcesQuery(undefined, { skip: !open });
  const sourceOptions = sourceResp?.data || [];

  const { data: usersResp } = useGetLeadUsersQuery(undefined, { skip: !open });
  const users = Array.isArray(usersResp?.data?.data) ? usersResp.data.data : [];

  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();
  const [bookMeeting, { isLoading: bookingMeeting }] = useBookLeadMeetingMutation();

  // -------- core form state ----------
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    property_address: '',
    zip_code: '',
    damage_type: '',
    storm_date: '',
    insurance_provider: '',
    claim_number: '',
    age_of_roof: '',
    type_of_roof: '',
    insured: '',
    lead_source: '',
    status: '',
    priority_level: '',
    assigned_to: '',
    inspection_date: '',
    follow_up_date: '',
    notes: '',
    retail_bid_request: ''
  });

  // -------- prefill from house on open/house change ----------
  useEffect(() => {
    if (!open) return;
    const initial = {
      full_name: nameFromHouse(house),
      email: house?.email || '',
      phone: house?.phone || '',
      property_address: [house?.address, house?.city, house?.state].filter(Boolean).join(', '),
      zip_code: zipFromAddress(house?.address),
      damage_type: '',
      storm_date: '',
      insurance_provider: '',
      claim_number: '',
      age_of_roof: '',
      type_of_roof: '',
      insured: '',
      lead_source: '',
      status: '',
      priority_level: '',
      assigned_to: '',
      inspection_date: '',
      follow_up_date: '',
      notes: (house?.notes || '').toString(),
      retail_bid_request: ''
    };
    setFormData(initial);
    setCurrentStep(0);
    setIsSuccess(false);
    setErrors({});
    setShowMeetingInputs(false);
    setMeetingDate(null);
    setSelectedSlot(null);
  }, [open, house]);

  // -------- meeting state ----------
  const [showMeetingInputs, setShowMeetingInputs] = useState(false);
  const [meetingDate, setMeetingDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const assignedUserId = formData.assigned_to ? Number(formData.assigned_to) : null;
  const meetingDateStr = meetingDate ? formatLocalYMD(meetingDate) : null;

  const { data: slotData, isLoading: loadingSlots } =
    useGetAvailableLeadSlotsQuery(
      (assignedUserId && meetingDateStr)
        ? { leadId: assignedUserId, date: meetingDateStr }
        : skipToken
    );
  const slots = slotData?.available_slots || [];

  // -------- UI state ----------
  const steps = [
    { id: 'personal', title: 'Personal', icon: <FiUser /> },
    { id: 'property', title: 'Property', icon: <FiHome /> },
    { id: 'insurance', title: 'Insurance', icon: <FiShield /> },
    { id: 'roof', title: 'Roof', icon: <FiClipboard /> },
    { id: 'management', title: 'Management', icon: <FiStar /> },
    { id: 'notes', title: 'Notes', icon: <FiFileText /> }
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // -------- handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'assigned_to') {
      const hasUser = !!value;
      setShowMeetingInputs(hasUser);
      setMeetingDate(null);
      setSelectedSlot(null);
    }
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? formatLocalYMD(date) : ''
    }));
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'full_name':
        if (!value.trim()) error = 'Full name is required';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'phone':
        if (!value) error = 'Phone is required';
        else if (!/^[\d\s\-()+]{10,}$/.test(value)) error = 'Invalid phone number';
        break;
      case 'zip_code':
        if (value && !/^\d{5}(-\d{4})?$/.test(value)) error = 'Invalid ZIP code';
        break;
      case 'notes':
        if (!value.trim()) error = 'Notes are required';
        break;
      case 'retail_bid_request':
        if (value && isNaN(Number(value))) error = 'Bid request must be a number';
        break;
      case 'age_of_roof':
        if (value && !/^\d+(\s*years?)?$/.test(value)) error = 'Enter years as a number';
        break;
      default: break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleNotesKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
  };

  const resetForm = () => {
    setIsSuccess(false);
    setCurrentStep(0);
    onClose?.(); // close modal after success if you prefer
  };

  // -------- SUBMIT with extra fields --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const required = ['full_name', 'email', 'phone', 'notes'];
    const newErrors = {};
    required.forEach(f => {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form');
      setIsSubmitting(false);
      return;
    }

    // Normalize IDs + add house/teritory
    const payload = {
      ...formData,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : undefined,
      status: formData.status ? Number(formData.status) : undefined,
      lead_source: formData.lead_source ? Number(formData.lead_source) : undefined,

      // 🔵 NEW: extra identifiers
      house_id: house?.id ?? undefined,
      teritory_id: teritoryId ?? undefined, // (spelling per your API example)
    };
    if (!formData.notes?.trim()) delete payload.notes;

    try {
      // 1) Create lead (with house_id + teritory_id)
      const leadResp = await createLead(payload).unwrap();
      const createdLeadId =
        leadResp?.data?.id ??
        leadResp?.lead?.id ??
        leadResp?.id;

      // 2) Optional meeting booking
      if (selectedSlot && assignedUserId) {
        const bookingPayload = {
          leadId: assignedUserId, // salesperson/user id
          date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          lead_id: createdLeadId, // link CRM lead
        };

        try {
          await bookMeeting(bookingPayload).unwrap();
          toast.success(`Meeting booked! Lead ID: ${createdLeadId}`);
        } catch (err) {
          toast.error('Lead saved, but booking failed: ' + (err?.data?.message || err.message));
        }
      } else {
        toast.success('Lead created successfully!');
      }

      setIsSuccess(true);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#0b0f1a] shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white text-lg font-semibold">Create New Lead</h2>
            {house?.address && (
              <p className="text-xs text-white/60 mt-1">
                Prefilled from: <span className="font-medium">{house.address}</span>
                {teritoryId ? ` • Territory #${teritoryId}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            title="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Modal body (scrollable) */}
        <div className="overflow-y-auto max-h-[calc(92vh-64px)] px-5 pb-5">
          {/* keep your exact dark form styles */}
          <div className="dark-form-container !bg-transparent !shadow-none !p-0">
            {/* Steps */}
            <div className="dark-form-steps">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`dark-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="dark-step-icon">
                    {index < currentStep ? <FiCheck size={16} /> : step.icon}
                  </div>
                  <span className="dark-step-title">{step.title}</span>
                </div>
              ))}
            </div>

            <form className="dark-form" onSubmit={handleSubmit}>
              {/* Step 0: Personal */}
              {currentStep === 0 && (
                <div className="dark-form-section">
                  <h3><FiUser /> Personal Information</h3>
                  <div className="dark-form-grid">
                    <div className={`dark-form-group ${errors.full_name ? 'error' : ''}`}>
                      <label>Full Name *</label>
                      <div className="dark-input-with-icon">
                        <FiUser className="dark-input-icon" />
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="John Doe"
                          aria-invalid={!!errors.full_name}
                        />
                      </div>
                      {errors.full_name && <span className="dark-error-message">{errors.full_name}</span>}
                    </div>

                    <div className={`dark-form-group ${errors.email ? 'error' : ''}`}>
                      <label>Email *</label>
                      <div className="dark-input-with-icon">
                        <FiMail className="dark-input-icon" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="john@example.com"
                          aria-invalid={!!errors.email}
                        />
                      </div>
                      {errors.email && <span className="dark-error-message">{errors.email}</span>}
                    </div>

                    <div className={`dark-form-group ${errors.phone ? 'error' : ''}`}>
                      <label>Phone *</label>
                      <div className="dark-input-with-icon">
                        <FiPhone className="dark-input-icon" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="(123) 456-7890"
                          aria-invalid={!!errors.phone}
                        />
                      </div>
                      {errors.phone && <span className="dark-error-message">{errors.phone}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Property */}
              {currentStep === 1 && (
                <div className="dark-form-section">
                  <h3><FiHome /> Property Information</h3>
                  <div className="dark-form-grid">
                    <div className="dark-form-group">
                      <label>Property Address</label>
                      <div className="dark-input-with-icon">
                        <FiMapPin className="dark-input-icon" />
                        <input
                          type="text"
                          name="property_address"
                          value={formData.property_address}
                          onChange={handleChange}
                          placeholder="123 Main St, Anytown, ST"
                        />
                      </div>
                    </div>

                    <div className={`dark-form-group ${errors.zip_code ? 'error' : ''}`}>
                      <label>ZIP Code</label>
                      <div className="dark-input-with-icon">
                        <FiMapPin className="dark-input-icon" />
                        <input
                          type="text"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="12345"
                          aria-invalid={!!errors.zip_code}
                        />
                      </div>
                      {errors.zip_code && <span className="dark-error-message">{errors.zip_code}</span>}
                    </div>

                    <div className="dark-form-group">
                      <label>Damage Type</label>
                      <div className="dark-select-with-icon">
                        <FiAlertTriangle className="dark-input-icon" />
                        <select
                          name="damage_type"
                          value={formData.damage_type}
                          onChange={handleChange}
                        >
                          <option value="">Select damage type</option>
                          {damageTypeOptions.map((type, index) => (
                            <option key={index} value={type}>{type}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Storm Date</label>
                      <div className="dark-datepicker-with-icon">
                        <FiCalendar className="dark-input-icon" />
                        <DatePicker
                          selected={formData.storm_date ? new Date(formData.storm_date) : null}
                          onChange={(date) => handleDateChange(date, 'storm_date')}
                          placeholderText="Select date"
                          dateFormat="MM/dd/yyyy"
                          className="dark-datepicker-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Insurance */}
              {currentStep === 2 && (
                <div className="dark-form-section">
                  <h3><FiShield /> Insurance Information</h3>
                  <div className="dark-form-grid">
                    <div className="dark-form-group">
                      <label>Insurance Provider</label>
                      <div className="dark-input-with-icon">
                        <FiShield className="dark-input-icon" />
                        <input
                          type="text"
                          name="insurance_provider"
                          value={formData.insurance_provider}
                          onChange={handleChange}
                          placeholder="State Farm, Allstate, etc."
                        />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Claim Number</label>
                      <div className="dark-input-with-icon">
                        <FiShield className="dark-input-icon" />
                        <input
                          type="text"
                          name="claim_number"
                          value={formData.claim_number}
                          onChange={handleChange}
                          placeholder="Enter claim number"
                        />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Insured</label>
                      <div className="dark-select-with-icon">
                        <FiShield className="dark-input-icon" />
                        <select
                          name="insured"
                          value={formData.insured}
                          onChange={handleChange}
                        >
                          <option value="">Select option</option>
                          {insuredOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Roof */}
              {currentStep === 3 && (
                <div className="dark-form-section">
                  <h3><FiClipboard /> Roof Specifications</h3>
                  <div className="dark-form-grid">
                    <div className="dark-form-group">
                      <label>Age of Roof</label>
                      <div className="dark-input-with-icon">
                        <FiClipboard className="dark-input-icon" />
                        <input
                          type="text"
                          name="age_of_roof"
                          value={formData.age_of_roof}
                          onChange={handleChange}
                          placeholder="e.g. 10 years"
                        />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Type of Roof</label>
                      <div className="dark-input-with-icon">
                        <FiClipboard className="dark-input-icon" />
                        <input
                          type="text"
                          name="type_of_roof"
                          value={formData.type_of_roof}
                          onChange={handleChange}
                          placeholder="e.g. Asphalt shingle, Metal, etc."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Management + Meeting */}
              {currentStep === 4 && (
                <div className="dark-form-section">
                  <h3><FiStar /> Lead Management</h3>
                  <div className="dark-form-grid">
                    <div className="dark-form-group">
                      <label>Lead Source</label>
                      <div className="dark-select-with-icon">
                        <FiStar className="dark-input-icon" />
                        <select
                          name="lead_source"
                          value={formData.lead_source}
                          onChange={handleChange}
                        >
                          <option value="">Select lead source</option>
                          {sourceOptions.map((source) => (
                            <option key={source.id} value={source.id}>{source.name}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Status</label>
                      <div className="dark-select-with-icon">
                        <FiStar className="dark-input-icon" />
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="">Select status</option>
                          {statusOptions.map((status) => (
                            <option key={status.id} value={status.id}>{status.name}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Priority Level</label>
                      <div className="dark-select-with-icon">
                        <FiStar className="dark-input-icon" />
                        <select
                          name="priority_level"
                          value={formData.priority_level}
                          onChange={handleChange}
                        >
                          <option value="">Select priority level</option>
                          {priorityLevelOptions.map((level, index) => (
                            <option key={index} value={level}>{level}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Assigned To</label>
                      <div className="dark-select-with-icon">
                        <FiUsers className="dark-input-icon" />
                        <select
                          name="assigned_to"
                          value={formData.assigned_to}
                          onChange={handleChange}
                        >
                          <option value="">Select user</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                        <FiChevronDown className="dark-select-arrow" />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Retail Bid Request</label>
                      <div className="dark-input-with-icon">
                        <FiUsers className="dark-input-icon" />
                        <input
                          type="text"
                          name="retail_bid_request"
                          value={formData.retail_bid_request}
                          onChange={handleChange}
                          placeholder="Bid Request In numbers"
                        />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Inspection Date</label>
                      <div className="dark-datepicker-with-icon">
                        <FiCalendar className="dark-input-icon" />
                        <DatePicker
                          selected={formData.inspection_date ? new Date(formData.inspection_date) : null}
                          onChange={(date) => handleDateChange(date, 'inspection_date')}
                          placeholderText="Select date"
                          dateFormat="MM/dd/yyyy"
                          className="dark-datepicker-input"
                        />
                      </div>
                    </div>

                    <div className="dark-form-group">
                      <label>Follow Up Date</label>
                      <div className="dark-datepicker-with-icon">
                        <FiCalendar className="dark-input-icon" />
                        <DatePicker
                          selected={formData.follow_up_date ? new Date(formData.follow_up_date) : null}
                          onChange={(date) => handleDateChange(date, 'follow_up_date')}
                          placeholderText="Select date"
                          dateFormat="MM/dd/yyyy"
                          className="dark-datepicker-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Meeting */}
                  {formData.assigned_to && (
                    <div className="dark-form-subsection">
                      <h4 className="dark-subtitle"><FiCalendar /> Meeting (optional)</h4>
                      <div className="dark-form-grid">
                        <div className="dark-form-group">
                          <label>Meeting Date</label>
                          <div className="dark-datepicker-with-icon">
                            <FiCalendar className="dark-input-icon" />
                            <DatePicker
                              selected={meetingDate}
                              onChange={(date) => { setMeetingDate(date); setSelectedSlot(null); }}
                              placeholderText="Choose a date to load slots"
                              dateFormat="MM/dd/yyyy"
                              className="dark-datepicker-input"
                              minDate={new Date()}
                            />
                          </div>
                        </div>
                      </div>

                      {meetingDate && (
                        <div className="dark-slots-box">
                          <div className="dark-slots-header">
                            Available slots for <strong>{meetingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>
                          </div>

                          {/* fetch once date is set */}
                          <Slots
                            assignedUserId={assignedUserId}
                            meetingDateStr={meetingDateStr}
                            loadingSlots={loadingSlots}
                            slots={slots}
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Notes */}
              {currentStep === 5 && (
                <div className="dark-form-section">
                  <h3><FiFileText /> Additional Notes</h3>
                  <div className={`dark-form-group ${errors.notes ? 'error' : ''}`}>
                    <label>Notes *</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyDown={handleNotesKeyDown}
                      rows="6"
                      placeholder="Enter any additional notes about this lead..."
                      aria-invalid={!!errors.notes}
                    />
                    {errors.notes && <span className="dark-error-message">{errors.notes}</span>}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="dark-form-navigation">
                {currentStep > 0 && (
                  <button type="button" onClick={prevStep} className="dark-btn dark-btn-secondary">
                    <FiArrowLeft /> Previous
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="dark-btn dark-btn-primary">
                    Next <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="dark-btn dark-btn-primary"
                    disabled={isSubmitting || isCreating || bookingMeeting}
                  >
                    {(isSubmitting || isCreating) ? 'Submitting...' : (bookingMeeting ? 'Booking...' : 'Submit Lead')}
                  </button>
                )}
              </div>
            </form>

            {/* Success card inside modal */}
            {isSuccess && (
              <div className="mt-5 dark-success-card">
                <div className="dark-success-icon"><FiCheck size={24} /></div>
                <h2>Lead Created Successfully!</h2>
                <p>Your new lead has been added to the system.</p>
                <div className="dark-success-actions">
                  <button onClick={resetForm} className="dark-btn dark-btn-primary">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* toasts */}
        <ToastContainer position="bottom-right" />
      </div>
    </div>
  );
}

// Smaller sub-component for slots (kept identical behavior)
function Slots({ assignedUserId, meetingDateStr, loadingSlots, slots, selectedSlot, setSelectedSlot }) {
  const trimTime = (t) => (t ? t.slice(0, 5) : '');
  if (!assignedUserId || !meetingDateStr) return null;

  if (loadingSlots) {
    return (
      <div className="dark-slots-grid">
        {[...Array(4)].map((_, i) => <div key={i} className="dark-slot skeleton" />)}
      </div>
    );
  }

  if (slots.length === 0) {
    return <div className="dark-empty-slots">No slots available for this date. Please try another date.</div>;
  }

  return (
    <div className="dark-slots-grid">
      {slots.map((slot, idx) => {
        const slotObj = {
          date: slot.date || meetingDateStr,
          start_time: trimTime(slot.start_time),
          end_time: trimTime(slot.end_time),
        };
        const isSelected = selectedSlot
          && selectedSlot.date === slotObj.date
          && selectedSlot.start_time === slotObj.start_time
          && selectedSlot.end_time === slotObj.end_time;

        return (
          <button
            type="button"
            key={idx}
            className={`dark-slot ${isSelected ? 'selected' : ''}`}
            onClick={() => setSelectedSlot(slotObj)}
          >
            {slotObj.start_time} - {slotObj.end_time}
          </button>
        );
      })}
    </div>
  );
}
