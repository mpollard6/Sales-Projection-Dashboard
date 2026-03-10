'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USERS = {
  "Troy Williams": "harbinger2025",
  "David Harbin": "harbinger2025",
  "Elijah Lee": "harbinger2025",
  "Stephen Mitchell": "harbinger2025",
  "Admin": "harbingeradmin",
};

export default function LoginPage() {
  const [rep, setRep] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!rep) { setError('Please select your name'); return; }
    if (USERS[rep] && password === USERS[rep]) {
      localStorage.setItem('harbinger_user', rep === 'Admin' ? 'admin' : rep);
      localStorage.setItem('harbinger_role', rep === 'Admin' ? 'admin' : 'rep');
      router.push('/dashboard');
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-harbinger-900 via-harbinger-800 to-harbinger-700 px-4">
      <div className="login-card bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-harbinger-700 to-harbinger-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">H</span>
          </div>
          <h1 className="text-3xl font-bold text-harbinger-900">Harbinger Marketing</h1>
          <p className="text-gray-500 mt-2 text-sm">Sales Pipeline Dashboard</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Name</label>
          <select value={rep} onChange={(e) => { setRep(e.target.value); setError(''); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800 focus:ring-2 focus:ring-harbinger-500 focus:border-transparent outline-none hover:border-gray-400 cursor-pointer bg-white">
            <option value="">— Choose —</option>
            <optgroup label="Sales Reps">
              {Object.keys(USERS).filter(k => k !== 'Admin').map(r => <option key={r} value={r}>{r}</option>)}
            </optgroup>
            <optgroup label="Management">
              <option value="Admin">Admin (All Reps)</option>
            </optgroup>
          </select>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
          <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5 text-gray-800 focus:ring-2 focus:ring-harbinger-500 focus:border-transparent outline-none hover:border-gray-400"
            placeholder="Enter password" />
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </div>}
          <button onClick={handleLogin}
            className="w-full bg-harbinger-700 text-white font-semibold py-3 rounded-lg hover:bg-harbinger-600 active:scale-[0.98] shadow-md hover:shadow-lg">Sign In</button>
          <p className="text-xs text-gray-400 text-center mt-6">Rep password: harbinger2025 | Admin: harbingeradmin</p>
        </div>
      </div>
    </div>
  );
}
