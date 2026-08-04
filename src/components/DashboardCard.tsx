"use client";

import { ReactNode } from "react";

export type DashboardCardColor = "yellow" | "green" | "pink" | "blue" | "purple" | "orange";

type DashboardCardProps = {
  title: string;
  value: string | number;
  color: DashboardCardColor;
  onClick?: () => void;
  interactive?: boolean;
  badge?: ReactNode;
};

const colorClasses: Record<DashboardCardColor, string> = {
  yellow: "bg-[#ffeb3b]",
  green: "bg-[#95e1d3]",
  pink: "bg-[#ff6b6b]",
  blue: "bg-[#4ecdc4]",
  purple: "bg-[#a8e6cf]",
  orange: "bg-[#ff8b94]",
};

export default function DashboardCard({ 
  title, 
  value, 
  color, 
  onClick, 
  interactive = false,
  badge 
}: DashboardCardProps) {
  const baseClasses = "neu-card p-4 transition-all duration-200";
  const colorClass = colorClasses[color];
  const interactiveClass = interactive 
    ? "cursor-pointer hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#1a1a1a]" 
    : "";

  return (
    <div 
      className={`${baseClasses} ${colorClass} ${interactiveClass}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase">{title}</p>
        {badge}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
