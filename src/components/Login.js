import React, { useState } from 'react';

// Fixed user credentials
const USERS = [
  { email: 'Usooludheen@gmail.com', password: 'Usooludheen1G2@32fgFgg', role: 'teamleader1' },
  { email: 'Shareea@gmail.com', password: 'Shareea2G2@32fds2jhh@12', role: 'teamleader2' },
  { email: 'LugaWalHalara@gmail.com', password: 'LugaWalHalara3G2@32fgFHjkhgg', role: 'teamleader3' },
  { email: 'admin2024Sports@gmail.com', password: 'admin1dss22@32fgFgg', role: 'admin' },
];

function Login({ onLogin, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      onLogin({ email: user.email, role: user.role });
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="relative p-6 sm:p-8">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-semibold transition-colors duration-200"
        aria-label="Close login form"
      >
        &times;
      </button>
      <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">LLLLLLLogin to Sports Portal</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
            Email:
          </label>
          <input
            type="email"
            id="email"
            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline w-full transition duration-200 ease-in-out transform hover:scale-105"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

export default Login;
