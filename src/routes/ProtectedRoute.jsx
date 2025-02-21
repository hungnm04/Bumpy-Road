import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";

const ProtectedRoute = ({ element, allowedRole }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetchWithAuth("http://localhost:5000/auth-status");
        if (response.ok) {
          const data = await response.json();
          setAuthState({
            loading: false,
            authenticated: data.authenticated,
            user: data.user,
          });
        } else {
          setAuthState({ loading: false, authenticated: false, user: null });
        }
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
