import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiUser, FiMail, FiPhone, FiHome, FiMapPin, FiAlertTriangle, 
  FiShield, FiClipboard, FiStar, FiUsers, FiFileText, 
  FiChevronDown, FiCalendar, FiCheck, FiArrowRight, FiArrowLeft,
  FiMenu, FiX
} from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import "./LeadForm.css";

// RTK Query hooks
import {
  useGetLeadStatusesQuery,
  useGetLeadSourcesQuery,
  useGetLeadUsersQuery,
  useCreateLeadMutation,
} from '../../features/leads/leadsApiSlice';

const damageTypeOptions = ['Roof', 'Siding', 'Windows', 'Flood', 'Other'];
const priorityLevelOptions = ['Low', 'Medium', 'High', 'Urgent'];
const insuredOptions = ['Yes', 'No'];

const LeadForm = () => {
  // Fetch API-based options
  const { data: statusResp } = useGetLeadStatusesQuery();
  const statusOptions = statusResp?.data || [];

  const { data: sourceResp } = useGetLeadSourcesQuery();
  const sourceOptions = sourceResp?.data || [];

  const { data: usersResp } = useGetLeadUsersQuery();
  const users = Array.isArray(usersResp?.data?.data) ? usersResp.data.data : [];

  // Mutations
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();

  // Form state
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

  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSteps, setShowMobileSteps] = useState(false);

  // Step definitions
  const steps = [
    { id: 'personal', title: 'Personal', icon: <FiUser /> },
    { id: 'property', title: 'Property', icon: <FiHome /> },
    { id: 'insurance', title: 'Insurance', icon: <FiShield /> },
    { id: 'roof', title: 'Roof', icon: <FiClipboard /> },
    { id: 'management', title: 'Management', icon: <FiStar /> },
    { id: 'notes', title: 'Notes', icon: <FiFileText /> }
  ];

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date ? date.toISOString().split('T')[0] : ''
    }));
  };

  // Field validation
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
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const requiredFields = ['full_name', 'email', 'phone', 'notes'];
    const newErrors = {};
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix the errors in the form');
      setIsSubmitting(false);
      return;
    }

    // Prepare data for API
    let payload = { ...formData };
    if (formData.notes && formData.notes.trim()) {
      payload.notes = formData.notes;
    } else {
      delete payload.notes;
    }

    try {
      const lead = await createLead(payload).unwrap();
      toast.success('Lead created successfully!');
      setIsSuccess(true);
    } catch (err) {
      toast.error(err?.data?.message || err.message || 'Failed to create lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (isMobile) setShowMobileSteps(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (isMobile) setShowMobileSteps(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
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
    setErrors({});
    setCurrentStep(0);
    setIsSuccess(false);
  };

  // Prevent Enter key from submitting in textarea
  const handleNotesKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  // Toggle mobile steps visibility
  const toggleMobileSteps = () => {
    setShowMobileSteps(!showMobileSteps);
  };

  if (isSuccess) {
    return (
      <div className="dark-form-container">
        <div className="dark-success-card">
          <div className="dark-success-icon">
            <FiCheck size={24} />
          </div>
          <h2>Lead Created Successfully!</h2>
          <p>Your new lead has been added to the system.</p>
          <div className="dark-success-actions">
            <button onClick={resetForm} className="dark-btn dark-btn-primary">
              Create Another Lead
            </button>
          </div>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="dark-form-container">
      <div className="dark-form-header">
        <h1>Create New Lead</h1>
        <p>Fill in the details below to add a new lead</p>
      </div>

      {/* Mobile Steps Toggle */}
      {isMobile && (
        <button 
          onClick={toggleMobileSteps}
          className="dark-mobile-steps-toggle"
        >
          {showMobileSteps ? <FiX size={20} /> : <FiMenu size={20} />}
          <span>{steps[currentStep].title}</span>
        </button>
      )}

      {/* Progress Steps */}
      <div className={`dark-form-steps-container ${showMobileSteps ? 'mobile-visible' : ''}`}>
        <div className="dark-form-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`dark-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => {
                setCurrentStep(index);
                if (isMobile) setShowMobileSteps(false);
              }}
            >
              <div className="dark-step-icon">
                {index < currentStep ? <FiCheck size={16} /> : step.icon}
              </div>
              <span className="dark-step-title">{step.title}</span>
              {isMobile && index === currentStep && (
                <div className="dark-step-mobile-indicator" />
              )}
            </div>
          ))}
        </div>
      </div>

      <form className="dark-form">
        {/* Personal Information */}
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
                  />
                </div>
                {errors.phone && <span className="dark-error-message">{errors.phone}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Property Information */}
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

        {/* Insurance Information */}
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

        {/* Roof Details */}
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

        {/* Lead Management */}
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
                      <option key={source.id} value={source.name}>{source.name}</option>
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
                      <option key={status.id} value={status.name}>{status.name}</option>
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
          </div>
        )}

        {/* Notes */}
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
              />
              {errors.notes && <span className="dark-error-message">{errors.notes}</span>}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
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
              type="button" 
              onClick={handleSubmit}
              className="dark-btn dark-btn-primary"
              disabled={isSubmitting || isCreating}
            >
              {(isSubmitting || isCreating) ? 'Submitting...' : 'Submit Lead'}
            </button>
          )}
        </div>
      </form>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default LeadForm;