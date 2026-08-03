"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#ffeb3b", "#95e1d3", "#ff6b6b", "#4ecdc4", "#a8e6cf"];

type ChartData = {
  date: string;
  count: number;
};

type DivisiData = {
  divisi: string;
  count: number;
};

export default function DashboardCharts({ dashboardData }: { dashboardData: any }) {
  const [kehadiran7Hari, setKehadiran7Hari] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/kehadiran-7-hari");
        const result = await response.json();
        if (result.ok) {
          setKehadiran7Hari(result.data);
        }
      } catch {
        setKehadiran7Hari([]);
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

  const statusData = [
    { name: "Hadir", value: dashboardData?.statistik?.Hadir || 0 },
    { name: "Izin", value: dashboardData?.statistik?.Izin || 0 },
    { name: "Sakit", value: dashboardData?.statistik?.Sakit || 0 },
    { name: "Terlambat", value: dashboardData?.statistik?.Terlambat || 0 },
    { name: "Alpha", value: dashboardData?.statistik?.Alpha || 0 },
  ];

  const divisiData = Object.entries(dashboardData?.kehadiranPerDivisi || {}).map(
    ([divisi, count]) => ({ divisi, count: count as number })
  );

  if (loading) {
    return <div className="neu-card bg-white p-6">Memuat grafik...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="neu-card bg-white p-6">
        <h3 className="text-lg font-bold uppercase mb-4">Kehadiran 7 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={kehadiran7Hari}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#1a1a1a" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="neu-card bg-white p-6">
        <h3 className="text-lg font-bold uppercase mb-4">Status Hari Ini</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="neu-card bg-white p-6 lg:col-span-2">
        <h3 className="text-lg font-bold uppercase mb-4">Kehadiran per Divisi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={divisiData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="divisi" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#4ecdc4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
