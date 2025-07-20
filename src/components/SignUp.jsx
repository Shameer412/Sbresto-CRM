import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Check, X } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else if (value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = () => {
    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });
    
    if (Object.keys(errors).length === 0) {
      console.log('Form submitted:', formData);
      // Handle form submission
    }
  };

  const getFieldIcon = (field) => {
    switch (field) {
      case 'name': return User;
      case 'email': return Mail;
      case 'password':
      case 'confirmPassword': return Lock;
      default: return User;
    }
  };

  const isFieldValid = (field) => {
    return formData[field] && !errors[field];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
        <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-sky-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse delay-2000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s linear infinite ${Math.random() * 2}s`,
              boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
            }}
          ></div>
        ))}
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/20 p-8 transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/25">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl mx-auto mb-4 flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-500 shadow-lg shadow-blue-500/30">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">Create Account</h1>
            <p className="text-slate-300">Join us and start your journey</p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Name Field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${focusedField === 'name' ? 'transform scale-105' : ''}`}>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <User className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'name' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Full Name"
                  className={`w-full bg-slate-800/50 backdrop-blur-sm border-2 rounded-xl pl-12 pr-12 py-4 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-0 ${
                    errors.name ? 'border-red-500' : focusedField === 'name' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-600/50'
                  } hover:border-slate-500/70`}
                />
                {isFieldValid('name') && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'transform scale-105' : ''}`}>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Mail className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Email Address"
                  className={`w-full bg-slate-800/50 backdrop-blur-sm border-2 rounded-xl pl-12 pr-12 py-4 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-0 ${
                    errors.email ? 'border-red-500' : focusedField === 'email' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-600/50'
                  } hover:border-slate-500/70`}
                />
                {isFieldValid('email') && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'transform scale-105' : ''}`}>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Lock className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Password"
                  className={`w-full bg-slate-800/50 backdrop-blur-sm border-2 rounded-xl pl-12 pr-12 py-4 text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:ring-0 ${
                    errors.password ? 'border-red-500' : focusedField === 'password' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-600/50'
                  } hover:border-slate-500/70`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors duration-300"
                >
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'transform scale-105' : ''}`}>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                  <Lock className={`w-5 h-5 transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-purple-400' : 'text-gray-500'}`} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                  placeholder="Confirm Password"
                  className={`w-full bg-white/10 backdrop-blur-sm border-2 rounded-xl pl-12 pr-12 py-4 text-white placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-0 ${
                    errors.confirmPassword ? 'border-red-500' : focusedField === 'confirmPassword' ? 'border-purple-500' : 'border-white/20'
                  } hover:border-white/40`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 relative overflow-hidden group"
            >
              <span className="relative z-10">Create Account</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors duration-300 font-medium">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}