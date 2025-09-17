// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Home } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setToken, setUser } from '../../features/auth/authSlice';
import './Login.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoginUserMutation } from '../../features/api/apiSlice';
import Logo from '../../assets/logo.jpg';
const Login = () => {
  const [loginFormData, setLoginFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setLoginFormData({ 
      ...loginFormData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(loginFormData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (loginFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await loginUser(loginFormData).unwrap();

      if (result.success && result.data?.token) {
        sessionStorage.setItem('authToken', result.data.token)
        dispatch(setToken(result.data.token));
        dispatch(setUser(result.data.user));

        const role = (result.data.role || '').toLowerCase();

        toast.success('Login Successful!', { 
          autoClose: 1200,
          className: 'toast-success',
          bodyClassName: 'toast-success-body'
        });

        setTimeout(() => {
          if (role === 'admin') {
            navigate('/');
          
          } else if (role === 'salesperson' || role === 'canvasser') {
            navigate('/employee');
          } else {
            toast.error('Unknown role! Contact admin.', {
              className: 'toast-error-role',
              bodyClassName: 'toast-error-role-body'
            });
          }
        }, 1000);
      } else {
        toast.error(result.message || 'Login failed', {
          className: 'toast-error-generic',
          bodyClassName: 'toast-error-generic-body'
        });
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request data';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      toast.error(errorMessage, {
        className: 'toast-error-api',
        bodyClassName: 'toast-error-api-body',
        autoClose: 3000
      });
    }
  };

  return (
    <div className="sbr-login-container  ">
      <div className="sbr-floating-shapes">
        <div className="sbr-shape sbr-shape-1"></div>
        <div className="sbr-shape sbr-shape-2"></div>
        <div className="sbr-shape sbr-shape-3"></div>
        <div className="sbr-shape sbr-shape-4"></div>
        <div className="sbr-shape sbr-shape-5"></div>
      </div>
      <div className="sbr-login-card">
        <div className="sbr-company-header">
          <div className="sbr-company-logo">
             <img src={Logo} alt="Southern Belle Logo"  width="150px" height="130px"/>
          </div>
          <h1 className="sbr-company-name">Southern Belle </h1>
          <p className="sbr-company-tagline">Building relationships far beyond any single project.</p>
        </div>
        <form onSubmit={handleSubmit} className="sbr-login-form">
          <div className="sbr-form-group">
            <label className="sbr-form-label" htmlFor="sbr-email">
              Email Address
            </label>
            <div className="sbr-input-wrapper">
              <input
                id="sbr-email"
                type="email"
                name="email"
                className="sbr-form-input"
                value={loginFormData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
              <Mail className="sbr-input-icon" size={20} />
            </div>
          </div>
          <div className="sbr-form-group">
            <label className="sbr-form-label" htmlFor="sbr-password">
              Password
            </label>
            <div className="sbr-input-wrapper">
              <input
                id="sbr-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="sbr-form-input"
                value={loginFormData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                minLength="6"
              />
              <Lock className="sbr-input-icon" size={20} />
              <button
                type="button"
                className="sbr-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="sbr-login-button"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <div className="sbr-loading-spinner"></div>
                Signing In...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
      <ToastContainer 
        position="top-right"
        toastClassName="sbr-toast"
        bodyClassName="sbr-toast-body"
        progressClassName="sbr-toast-progress"
      />
    </div>
  );
};

export default Login;