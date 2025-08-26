import React, { useState, useEffect, Suspense, lazy } from 'react';
import Login from './components/Login';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { app } from './firebase-config'; // Import the Firebase app instance

const TeamLeaderPortal = lazy(() => import('./components/TeamLeaderPortal'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const VisitorPortal = lazy(() => import('./components/VisitorPortal'));
const EventSchedule = lazy(() => import('./components/EventSchedule')); // Import the new EventSchedule component

function App() {
  const [user, setUser] = useState(null); // { email, role }
  const [showLoginModal, setShowLoginModal] = useState(false);
  const auth = getAuth(app); // Get the Auth instance

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, see if we have a role stored locally or fetch it
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no role is stored, default to 'visitor' or fetch from a database
          setUser({ email: firebaseUser.email, role: 'visitor' });
        }
      } else {
        // User is signed out
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [auth]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowLoginModal(false); // Hide login modal after successful login
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">College Sports Meet</h1>
        <div className="flex items-center">
          {user ? (
            <>
              <span className="mr-4">Welcome, {user.email} ({user.role})</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {/* Main content of the sports meet application */}
        <h2 className="text-3xl font-semibold mb-6 text-center">Welcome to the College Sports Meet!</h2>
        <p className="text-lg text-gray-700 text-center">
          Explore events, team information, and results. Please log in to access administrative or team leader functionalities.
        </p>

        {showLoginModal && !user && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50"> {/* Added z-50 */}
            <div className="bg-white p-8 rounded-lg shadow-2xl relative w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-scaleIn">
              <Login onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
            </div>
          </div>
        )}

        {/* Render content based on user role or show visitor portal */}
        <Suspense fallback={<div>Loading...</div>}>
          {user ? (
            user.role === 'admin' ? (
              <AdminPortal />
            ) : user.role === 'teamleader1' ? (
              <TeamLeaderPortal teamName="Usooludheen" />
            ) : user.role === 'teamleader2' ? (
              <TeamLeaderPortal teamName="Shareea" />
            ) : user.role === 'teamleader3' ? (
              <TeamLeaderPortal teamName="Luga Wal Halara" />
            ) : (
              // Fallback for logged-in users with no specific portal, or just show visitor portal
              <VisitorPortal />
            )
          ) : (
            // Show VisitorPortal when no user is logged in
            <VisitorPortal />
          )}

          {/* Display Event Schedule for all users */}
          <EventSchedule />
        </Suspense>
      </div>
    </div>
  );
}

export default App;
