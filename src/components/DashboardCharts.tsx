"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  label: string;
  count: number;
  range: string;
};

export default function DashboardCharts() {
  const [weeklyData, setWeeklyData] = useState<{ pagi: ChartData[]; malam: ChartData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/kehadiran-mingguan");
        const result = await response.json();
        if (result.ok) {
          setWeeklyData(result.data);
        }
      } catch {
        setWeeklyData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="neu-card bg-white p-6">Memuat grafik...</div>;
  }

  if (!weeklyData) {
    return <div className="neu-card bg-white p-6">Gagal memuat grafik</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="neu-card bg-white p-3 border-2 border-black">
          <p className="font-bold uppercase">{label}</p>
          <p className="text-sm">{payload[0].payload.range}</p>
          <p className="text-sm font-bold mt-1">Kehadiran: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="neu-card bg-white p-6">
        <h3 className="text-lg font-bold uppercase mb-4">Kehadiran Pagi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData.pagi}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#4ecdc4" 
              strokeWidth={3}
              name="Jumlah Hadir"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="neu-card bg-white p-6">
        <h3 className="text-lg font-bold uppercase mb-4">Kehadiran Malam</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyData.malam}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#ff6b6b" 
              strokeWidth={3}
              name="Jumlah Hadir"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
