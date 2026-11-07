"use client";

import React from "react";
import { ProviderDefinition } from "./types";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  ChevronRight,
  Server,
  Globe,
  ExternalLink,
} from "lucide-react";

interface ProviderListProps {
  providers: ProviderDefinition[];
  selectedSlug: string | null;
  onSelect: (provider: ProviderDefinition) => void;
}

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  selectedSlug,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
      {providers.map((provider) => {
        const isOperational = provider.status === "ACTIVE";
        const isSelected = selectedSlug === provider.slug;
        const isSmtp = provider.slug === "smtp";

        return (
          <div
            key={provider.provider_uuid}
            onClick={() => {
              if (isOperational) {
                onSelect(provider);
              }
            }}
            className={`relative p-4 rounded-xl border text-left transition-all ${
              !isOperational
                ? "opacity-60 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                : isSelected
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 btn hadow-sm ring-1 ring-indigo-500 cursor-pointer"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm btn hadow-sm ${
                    isSmtp
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : isOperational
                        ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {provider.logo ? (
                    <img
                      src={provider.logo}
                      alt={provider.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : isSmtp ? (
                    <Server className="w-5 h-5" />
                  ) : (
                    provider.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {provider.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                      {isSmtp ? "SMTP Protocol" : "REST API"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {isOperational ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="default">Coming Soon</Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2">
              {provider.description ||
                "Enterprise transactional email delivery service."}
            </p>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {isOperational
                  ? "Click to configure"
                  : "Integration in progress"}
              </span>
              {isOperational && (
                <span className="inline-flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                  Select <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
