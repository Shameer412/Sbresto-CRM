import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast, ToastContainer } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
  useGetLeadStatusesQuery,
  useGetLeadSourcesQuery,
  useGetLeadUsersQuery
} from '../../features/leads/leadsApiSlice';

const EditLeadPage = () => {
  const { id } = useParams();

  // Fetch lead, dropdowns
  const { data: leadResp, isLoading: loadingLead } = useGetLeadByIdQuery(id);
  const { data: statusResp } = useGetLeadStatusesQuery();
  const { data: sourceResp } = useGetLeadSourcesQuery();
  const { data: userResp } = useGetLeadUsersQuery();

  const [updateLead, { isLoading: isUpdating }] = useUpdateLeadMutation();
  const [formData, setFormData] = useState(null);
  const [success, setSuccess] = useState(false);

  // Dropdown options
  const statuses = statusResp?.data || [];
  const sources = sourceResp?.data || [];
  const users = userResp?.data?.data || [];

  // On load, set fields for editing; always cast notes to string, assigned_to to id
  useEffect(() => {
    if (leadResp) {
      setFormData({
        ...leadResp,
        notes: typeof leadResp.notes === 'string'
          ? leadResp.notes
          : (Array.isArray(leadResp.notes)
              ? leadResp.notes.map((n) => n.message || '').join('\n')
              : ''),
        assigned_to: leadResp.assigned_to?.id || leadResp.assigned_to || '',
      });
    }
  }, [leadResp]);

  // Handle changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date ? date.toISOString().split('T')[0] : ''
    }));
  };

  // Only allow fields accepted by backend
  function getCleanedPayload(raw) {
    // List of allowed fields (update as per your API)
    const fields = [
      "full_name", "email", "phone", "property_address", "zip_code",
      "damage_type", "storm_date", "insurance_provider", "claim_number",
      "age_of_roof", "type_of_roof", "insured", "lead_source", "retail_bid_request",
      "status", "priority_level", "assigned_to", "inspection_date", "follow_up_date", "notes"
    ];
    let payload = {};
    for (let key of fields) {
      if (raw[key] !== undefined) {
        if (key === "assigned_to" && raw.assigned_to)
          payload.assigned_to = Number(raw.assigned_to);
        else if (key === "notes")
          payload.notes = typeof raw.notes === "string" ? raw.notes : "";
        else
          payload[key] = raw[key];
      }
    }
    return payload;
  }

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedPayload = getCleanedPayload(formData);
    try {
      await updateLead({ leadId: id, ...cleanedPayload }).unwrap();
      toast.success("Lead updated successfully!");
      setSuccess(true);
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err?.data?.message || "Update failed. Please try again.");
    }
  };

  if (loadingLead || !formData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Lead Updated Successfully!</h2>
          <p className="text-gray-300 mb-6">The changes have been saved.</p>
          <a href="/leads" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            Back to Leads
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer position="bottom-right" theme="dark" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">
            Edit Lead: <span className="text-blue-400">{formData.full_name}</span>
          </h1>
          {/* <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button> */}
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* --- Personal Info --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Personal Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input name="full_name" value={formData.full_name || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input name="email" value={formData.email || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input name="phone" value={formData.phone || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
            </div>
            {/* --- Property Info --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Property Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                <input name="property_address" value={formData.property_address || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                <input name="zip_code" value={formData.zip_code || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Damage Type</label>
                <select name="damage_type" value={formData.damage_type || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                  <option value="">Select Damage Type</option>
                  {['Roof', 'Siding', 'Windows', 'Flood', 'Other'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* --- Insurance Info --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Insurance Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Insurance Provider</label>
                <input name="insurance_provider" value={formData.insurance_provider || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Claim Number</label>
                <input name="claim_number" value={formData.claim_number || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Insured?</label>
                <select name="insured" value={formData.insured || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
            {/* --- Roof Info --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Roof Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Age of Roof</label>
                <input name="age_of_roof" value={formData.age_of_roof || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type of Roof</label>
                <input name="type_of_roof" value={formData.type_of_roof || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Retail Bid Request</label>
                <input name="retail_bid_request" value={formData.retail_bid_request || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"/>
              </div>
            </div>
            {/* --- Lead Management --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Lead Management</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lead Source</label>
                <select name="lead_source" value={formData.lead_source || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                  <option value="">Select Lead Source</option>
                  {sources.map(opt => (
                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select name="status" value={formData.status || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                  <option value="">Select Status</option>
                  {statuses.map(opt => (
                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority Level</label>
                <select name="priority_level" value={formData.priority_level || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition">
                  <option value="">Select Priority</option>
                  {['Low', 'Medium', 'High', 'Urgent'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* --- Dates & Assignment --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Dates & Assignment</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Storm Date</label>
                <DatePicker
                  selected={formData.storm_date ? new Date(formData.storm_date) : null}
                  onChange={(date) => handleDateChange(date, 'storm_date')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholderText="Select Storm Date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Inspection Date</label>
                <DatePicker
                  selected={formData.inspection_date ? new Date(formData.inspection_date) : null}
                  onChange={(date) => handleDateChange(date, 'inspection_date')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholderText="Select Inspection Date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Follow Up Date</label>
                <DatePicker
                  selected={formData.follow_up_date ? new Date(formData.follow_up_date) : null}
                  onChange={(date) => handleDateChange(date, 'follow_up_date')}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholderText="Select Follow Up Date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
                <select name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                  <option value="">Select Assignee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* --- Notes --- */}
            <div className="md:col-span-2 lg:col-span-3 space-y-4">
              <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2">Notes</h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2
                ${isUpdating 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'
                }`}
            >
              {isUpdating ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Update Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadPage;
