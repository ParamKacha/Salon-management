// ============================================================
// src/components/ProtectedRoute.jsx
// ============================================================
// This component acts as a "guard" for private pages.
//
// HOW IT WORKS:
//   Wrap any Route that requires the user to be logged in
//   with <ProtectedRoute>. If the user IS logged in, the
//   page renders normally. If NOT, they are immediately
//   redirected to /login.
//
// USAGE in App.jsx:
//   <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// ============================================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  // Get the current user and loading state from our AuthContext
  const { user, loading } = useAuth();

  // Step 1: While the token is being verified on initial page load,
  // don't render ANYTHING yet. This prevents a "flash" where a valid
  // logged-in user briefly sees the /login page before the check finishes.
  if (loading) {
    // You can replace this with a proper loading spinner component later.
    // For now, returning null just renders a blank screen for a split second.
    return null;
  }

  // Step 2: If loading is done but there's no user, redirect to /login.
  // `replace` means the /login page replaces the current history entry,
  // so pressing the browser Back button won't bring them back to the
  // protected page they weren't allowed to see.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Step 3: If we reach here, the user IS logged in.
  // Render whatever child component was passed in (e.g., <Dashboard />).
  return children;
}

export default ProtectedRoute;
