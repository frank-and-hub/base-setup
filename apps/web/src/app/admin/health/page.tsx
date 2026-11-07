"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  Activity,
  Database,
  Server,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Cpu,
  ShieldCheck,
} from "lucide-react";

interface HealthData {
  status: "ok" | "degraded";
  timestamp: string;
  uptimeSeconds: number;
  totalLatencyMs: number;
  services: {
    postgres?: {
      status: "healthy" | "unhealthy";
      latencyMs?: number;
      error?: string;
    };
    mongodb?: {
      status: "healthy" | "unhealthy";
      latencyMs?: number;
      error?: string;
    };
    valkey?: {
      status: "healthy" | "unhealthy";
      latencyMs?: number;
      error?: string;
    };
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<HealthData>("/health");
      setHealth(res);
    } catch (err: any) {
      setError(err.message || "Failed to connect to health check endpoint");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Periodic polling if auto-refresh is active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHealth]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const isAllHealthy =
    health?.status === "ok" &&
    health?.services.postgres?.status === "healthy" &&
    health?.services.mongodb?.status === "healthy" &&
    health?.services.valkey?.status === "healthy";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "System Health & Monitoring" },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-600" />
              System Health & Monitoring
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live heartbeat diagnostics, database connectivity, and telemetry
              benchmarks across the micro-stack.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span>Live Polling (5s)</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHealth()}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Run Diagnostics
            </Button>
          </div>
        </div>
      </div>

      {/* Global Status Banner */}
      <div
        className={`p-6 rounded-2xl border btn hadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isAllHealthy
            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950"
            : "bg-gradient-to-r from-amber-50 to-rose-50 border-amber-200 text-amber-950"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl btn hadow-sm ${
              isAllHealthy
                ? "bg-emerald-600 text-white"
                : "bg-amber-600 text-white"
            }`}
          >
            {isAllHealthy ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {isAllHealthy
                ? "All Systems Fully Operational"
                : "System Degraded / Anomaly Detected"}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Last probe timestamp:{" "}
              {health?.timestamp
                ? new Date(health.timestamp).toLocaleTimeString()
                : "Checking..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Process Uptime
            </span>
            <span className="text-sm font-bold text-slate-800">
              {health?.uptimeSeconds !== undefined
                ? formatUptime(health.uptimeSeconds)
                : "—"}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block">
              Round-Trip Probe
            </span>
            <span className="text-sm font-bold text-indigo-700">
              {health?.totalLatencyMs !== undefined
                ? `${health.totalLatencyMs} ms`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Service Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. PostgreSQL Service Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 btn hadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    PostgreSQL
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Relational Database
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  health?.services.postgres?.status === "healthy"
                    ? "success"
                    : "danger"
                }
              >
                {health?.services.postgres?.status?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Stores core relational entities with strict ACID compliance:
              Users, Roles, Permissions, Menus, Settings, and Structured Audit
              Logs.
            </p>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Probe Method:</span>
                <span className="font-mono text-slate-700 font-medium">
                  SELECT 1
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Latency:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {health?.services.postgres?.latencyMs !== undefined
                    ? `${health.services.postgres.latencyMs} ms`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Port: 5432</span>
            <span>ORM: Prisma v5</span>
          </div>
        </div>

        {/* 2. MongoDB Service Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 btn hadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">MongoDB</h3>
                  <span className="text-[11px] text-slate-500">
                    Document Store
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  health?.services.mongodb?.status === "healthy"
                    ? "success"
                    : "danger"
                }
              >
                {health?.services.mongodb?.status?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Powers flexible, unstructured document storage: Application Error
              Logs, high-volume exception stack traces, and request payloads.
            </p>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Probe Method:</span>
                <span className="font-mono text-slate-700 font-medium">
                  Connection ReadyState
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Driver State:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {health?.services.mongodb?.status === "healthy"
                    ? "1 (Connected)"
                    : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Port: 27017</span>
            <span>ODM: Mongoose v8</span>
          </div>
        </div>

        {/* 3. Valkey Service Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 btn hadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Valkey</h3>
                  <span className="text-[11px] text-slate-500">
                    In-Memory Cache & KV
                  </span>
                </div>
              </div>
              <Badge
                variant={
                  health?.services.valkey?.status === "healthy"
                    ? "success"
                    : "danger"
                }
              >
                {health?.services.valkey?.status?.toUpperCase() || "UNKNOWN"}
              </Badge>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Provides ultra-low latency caching, JWT blacklist lookups, rate
              limiting counters, and session state invalidation.
            </p>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Probe Method:</span>
                <span className="font-mono text-slate-700 font-medium">
                  PING / PONG
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ping Latency:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {health?.services.valkey?.latencyMs !== undefined
                    ? `${health.services.valkey.latencyMs} ms`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Port: 6379</span>
            <span>Client: ioredis v5</span>
          </div>
        </div>
      </div>

      {/* Database Decision Architecture Guide */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 btn hadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Polyglot Persistence Architecture Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block text-blue-700">
              When to use PostgreSQL:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>
                Relational schemas with foreign keys and cascaded deletions.
              </li>
              <li>Financial transactions, user identity, credentials, RBAC.</li>
              <li>
                Structured audit trails where strict schema verification is
                required.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block text-emerald-700">
              When to use MongoDB:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>
                Semi-structured or schema-less high volume application logs.
              </li>
              <li>
                Uncaught exception traces and arbitrary HTTP telemetry payloads.
              </li>
              <li>
                Time-series logs with TTL indexes for automated archiving.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block text-rose-700">
              When to use Valkey:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>
                High-frequency volatile key-value counters (Rate Limiting).
              </li>
              <li>
                Revoked JWT access token blacklists with auto-expiring keys.
              </li>
              <li>Ephemeral lock management and transient caching.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
