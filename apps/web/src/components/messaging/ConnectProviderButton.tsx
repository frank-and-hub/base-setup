"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Mail } from "lucide-react";

interface ConnectProviderButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export const ConnectProviderButton: React.FC<ConnectProviderButtonProps> = ({
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  label = "Connect Your Email Provider",
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={`inline-flex items-center gap-2 btn hadow-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] ${className}`}
    >
      <Plus className="w-4 h-4" />
      <Mail className="w-4 h-4" />
      <span>{label}</span>
    </Button>
  );
};
