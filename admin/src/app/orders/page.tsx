"use client";

import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  ChevronRight
} from "lucide-react";

import { useState, useEffect } from "react";
import { fetchAdminOrders } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminOrders().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container">Loading Orders...</div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
         <h2 className="section-title">Order History</h2>
         <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1rem', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'white'
            }}>
               <Calendar size={16} />
               <span>Select Date</span>
            </button>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1rem', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: 'white'
            }}>
               <Download size={16} />
               <span>Export CSV</span>
            </button>
         </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
         <div className="stat-card">
            <div className="stat-title">Total Orders</div>
            <div className="stat-value">{orders.length}</div>
         </div>
         <div className="stat-card">
            <div className="stat-title">Pending</div>
            <div className="stat-value">{orders.filter(o => o.status === 'PENDING').length}</div>
         </div>
         <div className="stat-card">
            <div className="stat-title">Paid</div>
            <div className="stat-value">{orders.filter(o => ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status)).length}</div>
         </div>
         <div className="stat-card">
            <div className="stat-title">Cancelled</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{orders.filter(o => o.status === 'CANCELLED').length}</div>
         </div>
      </div>

      <div className="chart-section" style={{ padding: '0' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
               <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
               <input 
                 type="text" 
                 placeholder="Search by Order ID or Customer..." 
                 style={{ 
                   width: '100%', 
                   padding: '0.6rem 1rem 0.6rem 2.5rem', 
                   backgroundColor: 'var(--input)', 
                   border: 'none', 
                   borderRadius: '8px',
                   fontSize: '0.875rem'
                 }} 
               />
            </div>
            <button style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.6rem 1rem', 
              border: '1px solid var(--border)', 
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}>
               <Filter size={16} />
               <span>Filters</span>
            </button>
         </div>

         <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Order ID</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Date</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Customer</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Method</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Total</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}>Status</th>
                     <th style={{ padding: '1.25rem 1.5rem' }}></th>
                  </tr>
               </thead>
               <tbody>
                  {orders.map((order) => (
                     <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9375rem' }}>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--primary)' }}>#{order.id.slice(-6).toUpperCase()}</td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                           <div style={{ fontWeight: 600 }}>{order.guestName || order.user?.name || 'Customer'}</div>
                           <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.items?.length || 0} items</div>
                        </td>
                        <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>{order.paymentMethod}</td>
                        <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>₹{order.totalAmount.toLocaleString()}</td>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                           <span className={`badge ${
                             ['PAID', 'DELIVERED', 'SHIPPED'].includes(order.status) ? 'badge-success' : 
                             order.status === 'PENDING' ? 'badge-warning' : ''
                           }`} style={{ 
                             backgroundColor: order.status === 'CANCELLED' ? '#fee2e2' : '', 
                             color: order.status === 'CANCELLED' ? '#ef4444' : '' 
                           }}>
                             {order.status}
                           </span>
                        </td>

                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                           <button style={{ color: '#94a3b8', hover: { color: 'var(--primary)' } }}>
                              <ChevronRight size={20} />
                           </button>
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
