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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div
        className={`flex w-full max-w-4xl bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-500 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* left artwork panel (visible on large screens) */}
        <div
          className="hidden lg:block lg:w-2/5 bg-cover bg-center"
          style={{ backgroundImage: `url(${Logo})` }}
        />

        {/* right form panel */}
        <div className="w-full lg:w-3/5 p-8">
          <div className="text-center mb-6">
            <img
              src={Logo}
              alt="Southern Belle Logo"
              className="mx-auto w-24 h-24 rounded-lg mb-4"
            />
            <h1 className="text-3xl font-extrabold text-gray-800">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm">Sign in to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={loginFormData.email}
                onChange={handleInputChange}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-3 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginFormData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
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
          <div className="text-center mt-4 text-gray-600 text-sm">
            <Link
              to="/forgot-password"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
          <div className="text-center mt-2 text-gray-600 text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Create one
            </Link>
          </div>
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
