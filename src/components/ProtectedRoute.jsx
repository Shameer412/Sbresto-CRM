import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  if (!token) {
    // Redirect to login, preserve intended location for possible after-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default ProtectedRoute;
