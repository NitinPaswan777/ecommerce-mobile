'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, 
  LogOut, Bell, Search, Grid, CreditCard, MessageSquare 
} from "lucide-react";

export default function AdminAuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    
    if (!token && pathname !== '/login') {
      router.push('/login');
      setIsAuth(false);
    } else {
      setIsAuth(!!token);
      if (userData) setUser(JSON.parse(userData));
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuth && pathname !== '/login') {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-dot"></div>
          <span>instalook</span>
        </div>

        <nav className="flex-1">
          <div className="nav-group">
            <p className="nav-label">Main Menu</p>
            <a href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
            <a href="/products" className={`nav-link ${pathname.startsWith('/products') ? 'active' : ''}`}>
              <ShoppingBag size={20} />
              <span>Products</span>
            </a>
            <a href="/categories" className={`nav-link ${pathname.startsWith('/categories') ? 'active' : ''}`}>
              <Grid size={20} />
              <span>Categories</span>
            </a>
            <a href="/orders" className={`nav-link ${pathname.startsWith('/orders') ? 'active' : ''}`}>
              <CreditCard size={20} />
              <span>Orders</span>
            </a>
            <a href="/customers" className="nav-link">
              <Users size={20} />
              <span>Customers</span>
            </a>
            <a href="/sections" className={`nav-link ${pathname.startsWith('/sections') ? 'active' : ''}`}>
              <Grid size={20} />
              <span>Home Sections</span>
            </a>
          </div>

          <div className="nav-group">
            <p className="nav-label">Feedback</p>
            <a href="/reviews" className="nav-link">
              <MessageSquare size={20} />
              <span>Reviews</span>
            </a>
            <a href="/inventory" className="nav-link">
              <Grid size={20} />
              <span>Inventory</span>
            </a>
          </div>
        </nav>

        <div className="sidebar-footer" style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <a href="/settings" className={`nav-link ${pathname.startsWith('/settings') ? 'active' : ''}`} style={{ paddingLeft: 0 }}>
            <Settings size={20} />
            <span>Settings</span>
          </a>
          <button onClick={handleLogout} className="nav-link" style={{ paddingLeft: 0, color: '#ef4444', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-content">
        <header className="header">
          <div className="header-search">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                placeholder="Search orders, products..."
                style={{
                  backgroundColor: 'var(--input)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  fontSize: '0.875rem',
                  width: '320px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#64748b" />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                border: '2px solid white'
              }}></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700 }}>{user?.name || 'Admin User'}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.role || 'Super Admin'}</p>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=3b82f6&color=fff`}
                alt="Avatar"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </header>

        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
