"use client";

import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Package,
  Activity,
  MoreVertical
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

const data = [
  { name: 'Mon', sales: 4000, revenue: 2400 },
  { name: 'Tue', sales: 3000, revenue: 1398 },
  { name: 'Wed', sales: 2000, revenue: 9800 },
  { name: 'Thu', sales: 2780, revenue: 3908 },
  { name: 'Fri', sales: 1890, revenue: 4800 },
  { name: 'Sat', sales: 2390, revenue: 3800 },
  { name: 'Sun', sales: 3490, revenue: 4300 },
];

import { useState, useEffect } from "react";
import { fetchAdminStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAdminStats().then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading || !mounted) return <div className="page-container">Loading Stats...</div>;


  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <h2 className="section-title">Dashboard Overview</h2>
         <div className="date-filter">
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Live Data</span>
         </div>
      </div>

      <div className="dashboard-grid">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats?.revenue?.toLocaleString() || 0}`} 
          trend="+15.4%" 
          up={true} 
          icon={<DollarSign style={{ color: '#3b82f6' }} />}
        />
        <StatCard 
          title="Total Orders" 
          value={stats?.orders || 0} 
          trend="+5.2%" 
          up={true} 
          icon={<ShoppingBag style={{ color: '#10b981' }} />}
        />
        <StatCard 
          title="Low Stock" 
          value={stats?.lowStock || 0} 
          trend="Alert" 
          up={false} 
          icon={<Package style={{ color: '#f59e0b' }} />}
        />
        <StatCard 
          title="Total Users" 
          value={stats?.users || 0} 
          trend="+18%" 
          up={true} 
          icon={<Users style={{ color: '#8b5cf6' }} />}
        />
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="chart-section">
          <div className="section-header">
            <h3 className="section-title">Revenue Forecast</h3>
            <Activity size={18} color="#94a3b8" />
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-section">
          <div className="section-header">
            <h3 className="section-title">Sales by Category</h3>
            <MoreVertical size={18} color="#94a3b8" />
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Recent Orders</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
             <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem' }}>Order ID</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Product</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
             </thead>
             <tbody>
                {[
                  { id: '#ORD-7892', customer: 'Nitin Paswan', product: 'Premium Suit', amount: '₹12,400', status: 'Delivered', color: 'badge-success' },
                  { id: '#ORD-7893', customer: 'Rahul Sharma', product: 'Leather Shoes', amount: '₹4,500', status: 'In Transit', color: 'badge-primary' },
                  { id: '#ORD-7894', customer: 'Aman Deep', product: 'Silk Tie', amount: '₹1,200', status: 'Pending', color: 'badge-warning' },
                ].map((order, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9375rem' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{order.id}</td>
                    <td style={{ padding: '1rem' }}>{order.customer}</td>
                    <td style={{ padding: '1rem' }}>{order.product}</td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{order.amount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${order.color}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, up, icon }: any) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="stat-title">{title}</div>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          backgroundColor: '#f8fafc', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          {icon}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-trend ${up ? 'trend-up' : 'trend-down'}`}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{trend}</span>
        <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>from last month</span>
      </div>
    </div>
  );
}
