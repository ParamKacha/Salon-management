

import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const AuthContext = createContext();
export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');

    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null;
  });


  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {

        const response = await axiosInstance.get('/auth/me');


        if (response.data.success) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.log('Token is invalid or expired, logging out.');
        logoutUser();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []); 


  const login = async (email, password) => {

    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });

    // The backend returns: { success: true, token: "...", user: {...} }
    const { token: newToken, user: newUser } = response.data;

    // Save the token and user to localStorage so they survive a page refresh
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Update React state so the UI instantly reflects the logged-in status
    setToken(newToken);
    setUser(newUser);
  };

  // ============================================================
  // logoutUser() Function
  // ============================================================
  // Clears all auth data from state and localStorage.
  // Called on logout button click or when token verification fails.
  // ============================================================
  const logoutUser = () => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Reset React state to null
    setToken(null);
    setUser(null);
  };

  // Step 4: Pack everything we want to share into a value object
  // and pass it to the context Provider.
  // Any component wrapped by <AuthProvider> can read these values.
  const value = {
    user,    // The logged-in user object (or null if not logged in)
    token,   // The JWT token string (or null)
    loading, // True while we're verifying the token on mount
    login,   // The login function
    logoutUser, // The logout function
  };

  return (
    // The Provider component makes `value` available to all children
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  return useContext(AuthContext);
}
