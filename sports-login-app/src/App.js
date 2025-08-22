import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TeamLeaderPortal from './components/TeamLeaderPortal';
import AdminPortal from './components/AdminPortal';

function App() {
  const [user, setUser] = useState(null); // { email, role }

  useEffect(() => {
    // Check for existing session or token in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sports Portal</h1>
        <div className="flex items-center">
          <span className="mr-4">Welcome, {user.email} ({user.role})</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="container mx-auto p-4">
        {user.role === 'admin' && <AdminPortal />}
        {user.role.startsWith('teamleader') && <TeamLeaderPortal teamName={user.role.replace('teamleader', 'Team ')} />}
      </div>
    </div>
  );
}

export default App;
