import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Grid,
  CreditCard,
  MessageSquare,
  Image as ImageIcon
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel | E-Commerce",
  description: "Modern E-Commerce Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
                <a href="/" className="nav-link active">
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </a>
                <a href="/products" className="nav-link">
                  <ShoppingBag size={20} />
                  <span>Products</span>
                </a>
                <a href="/categories" className="nav-link">
                  <Grid size={20} />
                  <span>Categories</span>
                </a>
                <a href="/orders" className="nav-link">
                  <CreditCard size={20} />
                  <span>Orders</span>
                </a>
                <a href="/customers" className="nav-link">
                  <Users size={20} />
                  <span>Customers</span>
                </a>
                <a href="/sections" className="nav-link">
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
              <a href="/settings" className="nav-link" style={{ paddingLeft: 0 }}>
                <Settings size={20} />
                <span>Settings</span>
              </a>
              <a href="/logout" className="nav-link" style={{ paddingLeft: 0, color: '#ef4444' }}>
                <LogOut size={20} />
                <span>Logout</span>
              </a>
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
                    <p style={{ fontSize: '0.875rem', fontWeights: 700 }}>Nitin Paswan</p>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Super Admin</p>
                  </div>
                  <img
                    src="https://ui-avatars.com/api/?name=Nitin+Paswan&background=3b82f6&color=fff"
                    alt="Avatar"
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </header>

            <main>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
