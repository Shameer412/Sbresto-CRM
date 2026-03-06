// src/components/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useDispatch } from "react-redux";
import { setToken, setUser } from "../../features/auth/authSlice";
// styling now with tailwind – old CSS file removed
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLoginUserMutation } from "../../features/api/apiSlice";
import Logo from "../../assets/logo.jpg";

const Login = () => {
  const [loginFormData, setLoginFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const navigate = useNavigate();

  // trigger fade/slide-in
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e) => {
    setLoginFormData({
      ...loginFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(loginFormData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password length
    if (loginFormData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const result = await loginUser(loginFormData).unwrap();

      if (result.success && result.data?.token) {
        sessionStorage.setItem("authToken", result.data.token);
        dispatch(setToken(result.data.token));
        dispatch(setUser(result.data.user));

        // Role aur Company ka naam hasil karein
        const role = (result.data.role || "").toLowerCase();
        const companyName = (
          result.data.user?.company?.name || ""
        ).toLowerCase();

        toast.success("Login Successful!", {
          autoClose: 1200,
          className: "bg-green-600 text-white rounded-lg p-4 shadow-lg",
          bodyClassName: "text-sm",
        });

        // --- YEH HISSA BADLA GAYA HAI ---
        setTimeout(() => {
          // 1. Sab se pehle Political Canvassing ke admin ko check karein
          if (companyName === "political canvassing" && role === "admin") {
            navigate("/political-dashboard");

            // 2. Phir baaqi sab admins (jaise SBRESTO) ko check karein
          } else if (role === "admin") {
            navigate("/");

            // 3. Phir doosre roles ko check karein
          } else if (role === "salesperson" || role === "canvasser") {
            navigate("/employee");

            // 4. Agar koi role match na ho
          } else {
            toast.error("Unknown role! Contact admin.", {
              className: "bg-red-600 text-white rounded-lg p-4 shadow-lg",
              bodyClassName: "text-sm",
            });
          }
        }, 1000);
        // --- BADLA HUA HISSA YAHAN KHATAM ---
      } else {
        toast.error(result.message || "Login failed", {
          className: "bg-red-600 text-white rounded-lg p-4 shadow-lg",
          bodyClassName: "text-sm",
        });
      }
    } catch (error) {
      let errorMessage = "Login failed. Please try again.";

      if (error.status === 401) {
        errorMessage = "Invalid email or password";
      } else if (error.status === 400) {
        errorMessage = "Invalid request data";
      } else if (error.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }

      toast.error(errorMessage, {
        className: "bg-red-600 text-white rounded-lg p-4 shadow-lg",
        bodyClassName: "text-sm",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div
        className={`bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/20 p-8 w-full max-w-md transition-all duration-500 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="text-center mb-6">
          <img
            src={Logo}
            alt="Southern Belle Logo"
            className="mx-auto w-32 h-32 rounded-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-blue-400">Welcome Back</h1>
          <p className="text-slate-300 text-sm">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              value={loginFormData.email}
              onChange={handleInputChange}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-300/20"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={loginFormData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              minLength={6}
              className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-300/20"
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
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading && (
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
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="text-center mt-4 text-slate-400 text-sm">
          <Link
            to="/forgot-password"
            className="text-blue-400 hover:text-blue-300"
          >
            Forgot password?
          </Link>
        </div>
        <div className="text-center mt-2 text-slate-400 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Create one
          </Link>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        toastClassName="rounded-lg shadow-lg"
        bodyClassName="text-sm"
        progressClassName="bg-white/40"
      />
    </div>
  );
};

export default Login;
