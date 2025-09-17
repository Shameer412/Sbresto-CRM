import React, { useState, useEffect } from "react";
import { useGetUserLeadsQuery, useUpdateUserLeadsMutation } from "../../features/api/apiSlice";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiEdit } from "react-icons/fi";

const ProfileScreen = () => {
  const { data: userLeads, isLoading, error: fetchError, refetch } = useGetUserLeadsQuery();
  const [updateUserLeads, { isLoading: isUpdating }] = useUpdateUserLeadsMutation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    avatar: "",
    password: "",
    password_confirmation: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalForm, setOriginalForm] = useState({});

  useEffect(() => {
    if (userLeads) {
      const userData = userLeads.data?.user || userLeads.data || userLeads;
      const formattedData = {
        name: userData.name || "",
        email: userData.email || "",
        avatar: userData.avatar || "",
        password: "",
        password_confirmation: ""
      };
      setForm(formattedData);
      setOriginalForm(formattedData);
    }
  }, [userLeads]);

  useEffect(() => {
    if (fetchError) setError(fetchError.data?.message || "Failed to fetch profile data");
  }, [fetchError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (validationErrors.length) setValidationErrors([]);
    if (error) setError("");
  };

  const validatePassword = () => {
    if (form.password && form.password.length < 8) return "Password must be at least 8 characters";
    if (form.password && form.password !== form.password_confirmation) return "Passwords do not match";
    return null;
  };

  const handleCancel = () => {
    setForm(originalForm);
    setIsEditing(false);
    setValidationErrors([]);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword();
    if (passwordError) {
      setValidationErrors([passwordError]);
      return;
    }
    setError("");
    setSuccess("");
    const payload = { name: form.name, email: form.email };
    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    try {
      const response = await updateUserLeads(payload).unwrap();
      const updatedUser = response.data?.user || response.data || response;
      const updatedForm = {
        name: updatedUser.name || form.name,
        email: updatedUser.email || form.email,
        avatar: updatedUser.avatar || form.avatar,
        password: "",
        password_confirmation: ""
      };
      setForm(updatedForm);
      setOriginalForm(updatedForm);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
      refetch();
    } catch (err) {
      let messages = [];
      if (err.data) {
        if (typeof err.data === "object") {
          for (const key in err.data) {
            messages = [...messages, ...(Array.isArray(err.data[key]) ? err.data[key] : [err.data[key]])];
          }
        } else if (typeof err.data === "string") messages.push(err.data);
      } else if (err.message) messages.push(err.message);
      else messages.push("Failed to update profile");
      setValidationErrors(messages);
    }
  };

  if ((isLoading || isUpdating) && !form.name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const avatarUrl = form.avatar
    ? `https://sbresto.com/storage/${form.avatar.replace(/^\/+/, "")}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "U")}&background=0D8ABC&color=fff`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-6 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
          <p className="text-sm text-gray-500">Manage your personal information</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-4 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-white overflow-hidden">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "U")}&background=0D8ABC&color=fff`;
                }}
              />
            </div>
            <h2 className="text-xl font-semibold">{form.name || "User"}</h2>
            <p className="text-xs text-gray-200 mt-1">{form.email}</p>
          </div>

          {/* Alerts */}
          {(success || error || validationErrors.length > 0) && (
            <div className="p-4 border-b border-gray-200">
              {success && (
                <div className="flex items-center bg-green-50 border border-green-300 rounded p-3 text-sm text-green-700">
                  <FiCheck className="mr-2" />
                  {success}
                </div>
              )}
              {error && (
                <div className="flex items-center bg-red-50 border border-red-300 rounded p-3 text-sm text-red-700">
                  <FiX className="mr-2" />
                  {error}
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-300 rounded p-3 text-sm text-red-700">
                  <div className="flex items-center mb-1">
                    <FiX className="mr-2" />
                    <span>Please fix these errors:</span>
                  </div>
                  <ul className="list-disc pl-5 text-red-600">
                    {validationErrors.map((msg, idx) => (
                      <li key={idx} className="py-0.5 text-xs">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-5">
            {!isEditing ? (
              <>
                <div className="space-y-4 mb-6">
                  <InfoRow icon={<FiUser />} label="Full Name" value={form.name || "Not provided"} />
                  <InfoRow icon={<FiMail />} label="Email Address" value={form.email || "Not provided"} />
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                >
                  <FiEdit className="mr-1.5" size={14} />
                  Edit Profile
                </button>
              </>
            ) : (
              <EditForm
                form={form}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                setShowPassword={setShowPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                handleChange={handleChange}
                handleCancel={handleCancel}
                handleUpdate={handleUpdate}
                isUpdating={isUpdating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="bg-gray-100 p-2 rounded mr-3 text-gray-600">{icon}</div>
    <div className="flex-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</h3>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  </div>
);

const EditForm = ({
  form,
  showPassword,
  showConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
  handleChange,
  handleCancel,
  handleUpdate,
  isUpdating
}) => (
  <form onSubmit={handleUpdate} className="space-y-4">
    <InputField icon={<FiUser />} name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
    <InputField icon={<FiMail />} name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
    <PasswordField label="New Password (optional)" name="password" value={form.password} show={showPassword} toggle={() => setShowPassword(!showPassword)} onChange={handleChange} />
    <PasswordField label="Confirm Password" name="password_confirmation" value={form.password_confirmation} show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} onChange={handleChange} />
    <div className="flex space-x-3 pt-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isUpdating}
        className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isUpdating}
        className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded disabled:opacity-50"
      >
        {isUpdating ? "Saving..." : "Save"}
      </button>
    </div>
  </form>
);

const InputField = ({ icon, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{props.name}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">{icon}</div>
      <input
        {...props}
        className="w-full text-sm pl-8 pr-3 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
      />
    </div>
  </div>
);

const PasswordField = ({ label, name, value, show, toggle, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
        <FiLock size={14} />
      </div>
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full text-sm pl-8 pr-8 py-2 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        placeholder={label}
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
      >
        {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
      </button>
    </div>
  </div>
);

export default ProfileScreen;
