import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { fetchWithAuth } from "../../server/utils/fetchWithAuth";

const AuthRoute = ({ element }) => {
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
        console.error("Authentication error:", error.message);
        setAuthState({ loading: false, authenticated: false, user: null });
      }
    };

    checkAuth();
  }, []);

  if (authState.loading) {
    return <div>Loading...</div>;
  }

  if (authState.authenticated) {
    if (authState.user.role === "admin") {
      return <Navigate to="/admindashboard" replace />;
    } else if (authState.user.role === "guest") {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/" replace />; // Default redirect
    }
  }

  return element;
};

export default AuthRoute;
