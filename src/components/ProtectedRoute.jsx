import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { setToken } from "../features/auth/authSlice"; // Adjust path if needed

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const [authChecked, setAuthChecked] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  useEffect(() => {
    // Agar redux token missing hai, to sessionStorage se uthao
    if (!token) {
      const sessionToken = sessionStorage.getItem("authToken");
      if (sessionToken) {
        dispatch(setToken(sessionToken));
      }
    }
    setAuthChecked(true);
  }, [dispatch, token]);

  if (!authChecked) {
    // Spinner, skeleton, etc.
    return <div>Loading...</div>;
  }

  if (!token && authChecked) {
    // Ab sure hai ke token missing hai, to login pe bhejo
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
