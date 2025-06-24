import React, { useState, useEffect } from "react";
import { useGetUserLeadsQuery, useUpdateUserLeadsMutation } from "../../features/api/apiSlice";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiEdit } from "react-icons/fi";

const ProfileScreen = () => {
  // RTK Query hooks
  const { data: userLeads, isLoading, error: fetchError, refetch } = useGetUserLeadsQuery();
  const [updateUserLeads, { isLoading: isUpdating }] = useUpdateUserLeadsMutation();

  // Local state
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

  // When userLeads loaded, populate form
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
    if (fetchError) {
      setError(fetchError.data?.message || "Failed to fetch profile data");
    }
  }, [fetchError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
    if (error) setError("");
  };

  const validatePassword = () => {
    if (form.password && form.password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (form.password && form.password !== form.password_confirmation) {
      return "Passwords do not match";
    }
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
    setValidationErrors([]);
    const payload = {
      name: form.name,
      email: form.email
    };
    if (form.password) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }
    try {
      const response = await updateUserLeads(payload).unwrap();
      const updatedUser = response.data?.user || response.data || response;
      if (!updatedUser) throw new Error("Updated user data not found in response");
      const updatedForm = {
        name: updatedUser.name || form.name,
        email: updatedUser.email || form.email,
        avatar: updatedUser.avatar || form.avatar,
        password: "",
        password_confirmation: ""
      };
      setSuccess("Profile updated successfully!");
      setForm(updatedForm);
      setOriginalForm(updatedForm);
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
      refetch();
    } catch (err) {
      let messages = [];
      if (err.data) {
        if (typeof err.data === 'object') {
          for (const key in err.data) {
            if (Array.isArray(err.data[key])) {
              messages = [...messages, ...err.data[key]];
            } else {
              messages.push(err.data[key]);
            }
          }
        } else if (typeof err.data === 'string') {
          messages.push(err.data);
        }
      } else if (err.message) {
        messages.push(err.message);
      } else {
        messages.push("Failed to update profile");
      }
      setValidationErrors(messages);
    }
  };

  if ((isLoading || isUpdating) && !form.name) {
    return (
      <div className="ld-dark-mode min-h-screen bg-[var(--ld-bg-color)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--ld-primary-color)]"></div>
      </div>
    );
  }

  const avatarUrl = form.avatar
    ? `https://sbresto.com/storage/${form.avatar.replace(/^\/+/, '')}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "U")}&background=1e293b&color=fff`;

  return (
    <div className="ld-dark-mode min-h-screen bg-[var(--ld-bg-color)] text-[var(--ld-text-color)] py-6 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--ld-text-color)] mb-1">
            Profile Settings
          </h1>
          <p className="text-sm text-[var(--ld-text-secondary)]">
            Manage your personal information
          </p>
        </div>

        <div className="bg-[var(--ld-card-bg)] rounded-lg shadow-[var(--ld-card-shadow)] overflow-hidden">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-[#0f172a] to-[#1e293b] py-6 px-4 text-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-white/20 bg-[var(--ld-card-bg)] overflow-hidden">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      form.name || "U"
                    )}&background=1e293b&color=fff`;
                  }}
                />
              </div>
              <h2 className="text-xl font-semibold text-white">{form.name || "User"}</h2>
              <p className="text-xs text-[var(--ld-text-secondary)] mt-1">{form.email}</p>
            </div>
          </div>

          {/* Alerts */}
          {(success || error || validationErrors.length > 0) && (
            <div className="p-4 border-b border-[var(--ld-border-color)]">
              {success && (
                <div className="flex items-center bg-green-900/30 border border-green-500/50 rounded p-3 text-sm">
                  <FiCheck className="text-green-500 mr-2" />
                  <span className="text-green-400">{success}</span>
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-sm">
                  <div className="flex items-center text-red-500">
                    <FiX className="mr-2" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-sm">
                  <div className="flex items-center text-red-500 mb-1">
                    <FiX className="mr-2" />
                    <span>Please fix these errors:</span>
                  </div>
                  <ul className="list-disc pl-5 text-red-400">
                    {validationErrors.map((msg, idx) => (
                      <li key={idx} className="py-0.5 text-xs">{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Profile Content */}
          <div className="p-4 sm:p-5">
            {!isEditing ? (
              <>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-[var(--ld-border-color)] p-2 rounded mr-3">
                      <FiUser className="text-[var(--ld-text-color)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ld-text-secondary)]">
                        Full Name
                      </h3>
                      <p className="text-sm mt-0.5">{form.name || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-[var(--ld-border-color)] p-2 rounded mr-3">
                      <FiMail className="text-[var(--ld-text-color)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ld-text-secondary)]">
                        Email Address
                      </h3>
                      <p className="text-sm mt-0.5">{form.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center py-2 px-4 bg-[var(--ld-success-color)] hover:bg-[var(--ld-success-color)]/90 text-white text-sm font-medium rounded transition-colors duration-200"
                >
                  <FiEdit className="mr-1.5" size={14} />
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--ld-text-secondary)] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiUser className="text-[var(--ld-text-secondary)]" size={14} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full text-sm pl-8 pr-3 py-2 bg-[var(--ld-card-bg)] border border-[var(--ld-border-color)] rounded focus:ring-1 focus:ring-[var(--ld-primary-color)] focus:border-transparent outline-none transition-all"
                      placeholder="Full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--ld-text-secondary)] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiMail className="text-[var(--ld-text-secondary)]" size={14} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full text-sm pl-8 pr-3 py-2 bg-[var(--ld-card-bg)] border border-[var(--ld-border-color)] rounded focus:ring-1 focus:ring-[var(--ld-primary-color)] focus:border-transparent outline-none transition-all"
                      placeholder="Email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--ld-text-secondary)] mb-1">
                    New Password <span className="text-[var(--ld-text-secondary)] font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiLock className="text-[var(--ld-text-secondary)]" size={14} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full text-sm pl-8 pr-8 py-2 bg-[var(--ld-card-bg)] border border-[var(--ld-border-color)] rounded focus:ring-1 focus:ring-[var(--ld-primary-color)] focus:border-transparent outline-none transition-all"
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--ld-text-secondary)] hover:text-[var(--ld-text-color)]"
                    >
                      {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--ld-text-secondary)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <FiLock className="text-[var(--ld-text-secondary)]" size={14} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      value={form.password_confirmation}
                      onChange={handleChange}
                      className="w-full text-sm pl-8 pr-8 py-2 bg-[var(--ld-card-bg)] border border-[var(--ld-border-color)] rounded focus:ring-1 focus:ring-[var(--ld-primary-color)] focus:border-transparent outline-none transition-all"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--ld-text-secondary)] hover:text-[var(--ld-text-color)]"
                    >
                      {showConfirmPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-transparent border border-[var(--ld-border-color)] hover:bg-[var(--ld-hover-item)] text-[var(--ld-text-color)] text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-2 px-4 bg-[var(--ld-primary-color)] hover:bg-[var(--ld-primary-color)]/90 text-white text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;