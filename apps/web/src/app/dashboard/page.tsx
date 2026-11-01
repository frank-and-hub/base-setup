'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UserActivityLog } from '@monorepo/shared-types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  User,
  Shield,
  Activity,
  KeyRound,
  Clock,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchMyActivities = async () => {
      try {
        const res = await api.get<UserActivityLog[]>('/activity-logs/me');
        setActivities(res);
      } catch (err) {
        console.error('Failed to load user activities', err);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchMyActivities();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold bg-white/20 px-2.5 py-0.5 rounded-full text-indigo-50">
              User Portal
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <CheckCircle2 className="w-3 h-3" />
              Account Active
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.first_name || 'Member'}!
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            You are securely authenticated as a standard member. From this dashboard, you can review your recent activity, update your profile details, and manage authentication credentials.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/dashboard/profile">
              <Button variant="secondary" size="sm" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-sm">
                <User className="w-4 h-4 mr-1.5" />
                Manage Profile & Security
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Identity Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <Badge variant="indigo">{user?.role}</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Account Identity</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your registered email and unique identifier</p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-800">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">User UUID:</span>
                <span className="font-mono text-slate-600 text-[10px] truncate max-w-[150px]" title={user?.user_uuid}>
                  {user?.user_uuid}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
            >
              <span>Edit profile details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Shield className="w-5 h-5" />
              </div>
              <Badge variant="success">Protected</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Security & Sessions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Argon2id hashing & rotating JWT tokens</p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Last Login:</span>
                <span className="font-medium text-slate-800">
                  {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Today'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-700 font-bold">{user?.status}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between"
            >
              <span>Change account password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Access Rights Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <Badge variant="default">Standard</Badge>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Authorization Scope</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enforced by NestJS backend guards</p>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              As a standard member, administrative panels and system configurations are isolated from your account. Your credentials grant access exclusively to personal member endpoints.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Strict RBAC privilege isolation
          </div>
        </div>
      </div>

      {/* Personal Activity Feed */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">My Recent Activity Feed</h2>
          </div>
          <span className="text-xs text-slate-500">Live activity log recorded on backend</span>
        </div>

        {isLoadingActivities ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No activity events recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act.activity_log_uuid}
                className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100/60 text-indigo-700 rounded-lg">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block font-mono">
                      {act.action}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      IP: {act.ip_address || '127.0.0.1'} • Correlation: {act.correlation_id.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(act.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

