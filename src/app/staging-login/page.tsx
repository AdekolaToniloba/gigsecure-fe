'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StagingLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/staging-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect home with hard reload to push through middleware
        window.location.href = '/';
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="GigSecure"
            width={160}
            height={40}
            className="h-8 w-auto object-contain cursor-pointer"
            onClick={() => router.push('/')}
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-heading font-extrabold text-[#004E4C]">
          Staging Environment
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          This environment is restricted. Please enter the staging password to continue.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#334155] mb-2">
                Staging Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#004E4C] focus:border-[#004E4C] sm:text-sm"
                  placeholder="Enter password"
                />
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600" id="password-error">
                  {error}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-[#004E4C] bg-[#FFE419] hover:bg-[#EBD001] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004E4C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Authenticating...' : 'Access Staging'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
