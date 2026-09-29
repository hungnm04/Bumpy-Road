import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../api/session";

const ProtectedRoute = ({ element, allowedRole }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        setAuthState({ loading: false, ...session });
      } catch (error) {
        console.error("Protected route error:", error.message);
        setAuthState({ loading: false, authenticated: false, user: null });
      }
    };

    checkAuth();
  }, []);

  if (authState.loading) {
    return <div>Loading...</div>;
  }

  if (!authState.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && authState.user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
