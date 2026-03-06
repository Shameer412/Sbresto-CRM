// src/pages/RegisterFromInvite.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import {
  useVerifyInviteQuery,
  useRegisterFromInviteMutation,
} from "../features/leads/leadsApiSlice";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegisterFromInvite() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Verify token API
  const {
    data: verifyData,
    isLoading,
    isError,
  } = useVerifyInviteQuery(token ?? "", {
    skip: !token,
  });

  // Register mutation
  const [registerFromInvite, { isLoading: isSubmitting, error: submitError }] =
    useRegisterFromInviteMutation();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inviteEmail = useMemo(() => verifyData?.email ?? "", [verifyData]);

  // Validation
  const validateAll = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name is required";
    else if (formData.name.trim().length < 2)
      e.name = "Name must be at least 2 characters";

    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      e.confirmPassword = "Please confirm password";
    else if (formData.confirmPassword !== formData.password)
      e.confirmPassword = "Passwords do not match";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateAll()) return;
    if (!verifyData?.verified) return;

    try {
      await registerFromInvite({
        token,
        email: inviteEmail,
        name: formData.name.trim(),
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      }).unwrap();
      toast.success("Account created! Redirecting...", {
        className: "bg-green-600 text-white rounded-lg p-4 shadow-lg",
        bodyClassName: "text-sm",
        autoClose: 1200,
      });
      setTimeout(() => navigate("/login"), 1300);
    } catch (err) {
      console.error("Signup failed:", err);
      toast.error(err?.data?.message || "Signup failed. Please try again.", {
        className: "bg-red-600 text-white rounded-lg p-4 shadow-lg",
        bodyClassName: "text-sm",
      });
    }
  };

  // --- Loading/Error states ---
  if (isLoading) return <CenteredCard>Verifying invite…</CenteredCard>;
  if (isError)
    return <CenteredCard>Verification failed. Try again.</CenteredCard>;
  if (!verifyData?.verified)
    return (
      <CenteredCard>
        {verifyData?.message || "Invalid or expired invitation."}
      </CenteredCard>
    );

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Signup form ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div
        className={`bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/20 p-8 w-full max-w-md transition-all duration-500 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-6">
          Create Account
        </h1>

        {/* Email (locked) */}
        <div className="mb-4 relative">
          <label className="text-slate-300 block mb-1">Email</label>
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={inviteEmail}
            readOnly
            disabled
            className="w-full pl-10 bg-slate-800/50 border border-slate-600 rounded-xl p-3 text-white"
          />
        </div>

        {/* Name */}
        <div className="mb-4 relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full pl-10 pr-3 bg-slate-800/50 border rounded-xl p-3 text-white ${
              errors.name ? "border-red-500" : "border-slate-600"
            }`}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full pl-10 pr-10 bg-slate-800/50 border rounded-xl p-3 text-white ${
              errors.password ? "border-red-500" : "border-slate-600"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full pl-10 pr-10 bg-slate-800/50 border rounded-xl p-3 text-white ${
              errors.confirmPassword ? "border-red-500" : "border-slate-600"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {submitError && (
          <p className="text-red-400 text-sm mb-3">
            {submitError?.data?.message || "Signup failed. Please try again."}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          )}
          {isSubmitting ? "Creating…" : "Create Account"}
        </button>

        <p className="text-slate-400 text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Sign In
          </Link>
        </p>
      </div>
      <ToastContainer
        position="top-right"
        toastClassName="rounded-lg shadow-lg"
        bodyClassName="text-sm"
        progressClassName="bg-white/40"
      />
    </div>
  );
}

// Small helper wrapper for centered messages
function CenteredCard({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-slate-800/80 border border-blue-500/20 rounded-2xl p-6 w-full max-w-md text-center text-slate-200">
        {children}
      </div>
    </div>
  );
}
