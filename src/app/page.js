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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-harbinger-900 via-harbinger-800 to-harbinger-700">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-harbinger-900">Harbinger Marketing</h1>
          <p className="text-gray-500 mt-2">Sales Pipeline Dashboard</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Your Name</label>
          <select value={rep} onChange={(e) => { setRep(e.target.value); setError(''); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800 focus:ring-2 focus:ring-harbinger-500 focus:border-transparent outline-none">
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
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-gray-800 focus:ring-2 focus:ring-harbinger-500 focus:border-transparent outline-none"
            placeholder="Enter password" />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button onClick={handleLogin}
            className="w-full bg-harbinger-700 text-white font-semibold py-3 rounded-lg hover:bg-harbinger-600 transition-colors">Sign In</button>
          <p className="text-xs text-gray-400 text-center mt-6">Rep password: harbinger2025 | Admin: harbingeradmin</p>
        </div>
      </div>
    </div>
  );
}
