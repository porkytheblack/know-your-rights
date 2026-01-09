"use client";

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Users, Clock, Search, Star, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  
  useEffect(() => {
      if (token) {
          fetchStats();
      }
  }, [token]);

  const fetchStats = async () => {
      try {
          const res = await fetch('http://localhost:8000/api/admin/analytics/stats', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setStats(data);
          }
      } catch (e) {
          console.error("Failed to fetch stats", e);
      }
  };

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  // Transform for Chart
  const categoryData = stats.queries_by_category || [];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Total Documents"
            value={stats.kpi.total_documents}
            trend="+12%"
            trendUp={true}
            icon={<FileText className="text-[var(--primary-blue)]" />}
        />
        <KPICard 
            title="Total Chunks"
            value={stats.kpi.total_chunks}
            trend="Indexed"
            trendUp={true}
            icon={<Search className="text-[var(--success-green)]" />}
            accent="green"
        />
         <KPICard 
            title="Queries Today"
            value={stats.kpi.queries_today}
            trend="Active"
            trendUp={true}
            icon={<Clock className="text-[var(--warning-yellow)]" />}
            accent="yellow"
        />
        <KPICard 
            title="Avg Rating"
            value="4.2"
            trend="+0.3"
            trendUp={true}
            icon={<Star className="text-[var(--error-red)]" />}
            accent="red"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Queries by Category */}
        <div className="bg-white p-6 rounded-xl border border-[var(--gray-200)] shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--gray-900)]">Queries by Category</h3>
                <button className="text-[var(--gray-500)] hover:text-[var(--primary-blue)] transition-colors">
                    <Download size={18} />
                </button>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#6B7280" fontSize={12} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={12} tickLine={false} width={80} />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="count" fill="var(--primary-blue)" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Line Chart - Volume Trend */}
        <div className="bg-white p-6 rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[var(--gray-900)]">Volume Trend</h3>
                <span className="text-xs text-[var(--success-green)] font-medium flex items-center">
                    <TrendingUp size={14} className="mr-1" /> Last 7 Days
                </span>
            </div>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.volume_trend}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                         <XAxis dataKey="day" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                         <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                         />
                         <Line 
                            type="monotone" 
                            dataKey="queries" 
                            stroke="var(--primary-blue)" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: "white", strokeWidth: 2 }} 
                            activeDot={{ r: 6 }} 
                         />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[var(--gray-200)] shadow-sm">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">Recent Activity</h3>
            <div className="space-y-4">
                {stats.recent_queries && stats.recent_queries.length > 0 ? (
                    stats.recent_queries.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[var(--gray-50)] rounded-lg">
                            <span className="text-[var(--gray-700)] text-sm font-medium truncate max-w-[500px]">{item.q}</span>
                            <span className="text-[var(--gray-500)] text-xs whitespace-nowrap">
                                {new Date(item.date).toLocaleString()}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-gray-400 text-center py-4">No recent queries found.</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, trend, trendUp, icon, accent = 'blue' } : any) {
    const accentColors: any = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-[var(--gray-200)] shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", accentColors[accent])}>
                    {icon}
                </div>
                <div className={cn(
                    "flex items-center text-xs font-semibold px-2 py-1 rounded-full",
                    trendUp ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100"
                )}>
                    {trendUp ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {trend}
                </div>
            </div>
            <h3 className="text-[var(--gray-500)] text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-[var(--gray-900)] mt-1">{value}</p>
        </div>
    )
}

export default DashboardPage;
