'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Users, FileText, ExternalLink, LogOut, Layers, Shield, Database, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const navItems = [
    { label: 'User Management (PostgreSQL)', href: '/users', icon: Users },
    { label: 'Audit Logs (MongoDB)', href: '/audit-logs', icon: FileText },
  ];

  const roleBadgeVariant =
    user?.role === 'ADMIN' ? 'indigo' : user?.role === 'MODERATOR' ? 'amber' : 'slate';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Brand & Links */}
            <div className="flex items-center gap-8">
              <Link href="/users" className="flex items-center gap-2.5 font-bold text-slate-900">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <span>Monorepo Stack</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <a
                  href="http://localhost:4000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Swagger Docs
                </a>
              </nav>
            </div>

            {/* Right: User Profile & Logout */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 text-right">
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <Badge variant={roleBadgeVariant}>{user?.role}</Badge>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

