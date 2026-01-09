"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch('http://localhost:8000/api/admin/auth/login', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Invalid credentials');

        const data = await res.json();
        localStorage.setItem('admin_token', data.access_token);
        router.push('/admin/dashboard');
    } catch (err) {
        setError('Login failed. Please check your credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--gray-50)] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-[var(--gray-200)]">
        <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[var(--primary-blue-light)] rounded-xl flex items-center justify-center mx-auto mb-4 text-[var(--primary-blue)]">
                <Lock />
            </div>
            <h1 className="text-2xl font-bold text-[var(--gray-900)]">Admin Portal</h1>
            <p className="text-[var(--gray-600)] mt-2">Sign in to manage the platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--gray-700)]">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-[var(--gray-400)]" size={20} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--gray-300)] focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent outline-none transition-all"
                        placeholder="admin@example.com"
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--gray-700)]">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-[var(--gray-400)]" size={20} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--gray-300)] focus:ring-2 focus:ring-[var(--primary-blue)] focus:border-transparent outline-none transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {error}
                </div>
            )}

            <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-[var(--gray-600)] cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[var(--primary-blue)] focus:ring-[var(--primary-blue)]" />
                    Remember me
                </label>
                <Link href="#" className="text-[var(--primary-blue)] hover:underline font-medium">
                    Forgot password?
                </Link>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[var(--primary-blue)] text-white py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-blue-dark)] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Signing in...
                    </>
                ) : (
                    <>
                        Sign In <ArrowRight size={20} />
                    </>
                )}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--gray-200)] text-center text-sm text-[var(--gray-500)]">
            <Link href="/" className="hover:text-[var(--gray-900)] transition-colors">
                ← Back to Home
            </Link>
        </div>
      </div>
    </div>
  );
}
