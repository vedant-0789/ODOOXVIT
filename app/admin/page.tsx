'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  full_name: string;
  role: string;
  isActive?: boolean;
};

export default function AdminDashboard() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [managerId, setManagerId] = useState('');
  
  const [managers, setManagers] = useState<Profile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    // Basic route protection: ensure user is logged in
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/signin');
      } else {
        // Double-check if they are an admin in profiles
        supabase.from('profiles').select('role').eq('id', data.user.id).single().then(({ data: profileData }) => {
          if (profileData?.role !== 'Admin') {
            router.push('/signin');
          } else {
            fetchUsers();
          }
        });
      }
    });
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setUsers(data);
        setManagers(data.filter((u: Profile) => u.role === 'Manager' || u.role === 'Admin'));
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, managerId })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setMessage(`User ${name} created! (Simulated Email) Password sent: ${data.password}`);
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Provision New User (Employee / Manager)</h2>
          {message && <div className="mb-4 text-green-600 bg-green-50 p-3 rounded">{message}</div>}
          {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  {/* Admin role is hidden since there should only be one Admin */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="">None (Optional)</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {loading ? 'Inviting...' : 'Create User & Send Email'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Users</h2>
          <ul className="divide-y divide-gray-200">
            {users.map(user => (
              <li key={user.id} className="py-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.isActive ? '🟢 Active' : '⚪ Pending Login'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
