"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart2, FileText, Settings, LogOut, Briefcase, 
  Newspaper, Scale 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { href: '/admin/documents', label: 'Documents', icon: <FileText size={20} /> },
    { href: '/admin/news', label: 'News Scraper', icon: <Newspaper size={20} /> },
    { href: '/admin/jobs', label: 'Processing Jobs', icon: <Briefcase size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--gray-100)] flex font-[family-name:var(--font-inter)]">
      {/* Sidebar with mobile toggle support (simplified) */}
      <aside className="w-[240px] bg-[var(--gray-900)] text-white flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-800 flex items-center gap-2">
            <Scale className="text-[var(--primary-blue)]" />
            <span className="font-bold text-lg">Admin Portal</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href 
                  ? "bg-[var(--primary-blue)] text-white" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
            <Link 
                href="/admin/settings" 
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
                <Settings size={20} />
                Settings
            </Link>
            <Link 
                href="/auth/logout" // detailed auth flow deferred to API integration
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors mt-1"
            >
                <LogOut size={20} />
                Logout
            </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[var(--gray-200)] h-16 flex items-center justify-between px-6 md:px-8 shadow-sm">
            <h1 className="text-xl font-semibold text-[var(--gray-900)] capitalized">
                {navItems.find(i => i.href === pathname)?.label || 'Overview'}
            </h1>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[var(--gray-900)]">Admin User</p>
                  <p className="text-xs text-[var(--gray-500)]">admin@knowyourrights.ke</p>
               </div>
               <div className="h-8 w-8 rounded-full bg-[var(--primary-blue-light)] flex items-center justify-center text-[var(--primary-blue)] font-bold">
                 A
               </div>
            </div>
        </header>

        <div className="flex-1 overflow-auto p-6 md:p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
