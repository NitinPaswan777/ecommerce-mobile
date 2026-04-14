"use client";

import { 
  Menu, 
  Search, 
  Settings, 
  Grid, 
  MoreVertical, 
  Bell,
  LayoutDashboard,
  ShoppingCart,
  Zap,
  Layers,
  FileText,
  Map,
  Users,
  PieChart,
  Table as TableIcon,
  Type,
  Layout,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./admin.css"; // Admin specific CSS

const ShoppingBag = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);

const SIDEBAR_GROUPS = [
  {
    title: "MAIN",
    links: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "E-Commerce", href: "/admin/ecommerce", icon: ShoppingBag, badge: "Hot", badgeColor: "bg-emerald-500" },
      { name: "Apps", href: "/admin/apps", icon: Grid },
      { name: "Widgets", href: "/admin/widgets", icon: Layout, badge: "8", badgeColor: "bg-amber-500" },
    ]
  },
  {
    title: "COMPONENT",
    links: [
      { name: "UI Elements", href: "/admin/ui", icon: Layers },
      { name: "Forms", href: "/admin/forms", icon: FileText },
      { name: "Charts", href: "/admin/charts", icon: PieChart },
      { name: "Tables", href: "/admin/tables", icon: TableIcon },
      { name: "Icons", href: "/admin/icons", icon: Type },
      { name: "Maps", href: "/admin/maps", icon: Map },
    ]
  },
  {
    title: "FEATURED",
    links: [
      { name: "Special Pages", href: "/admin/pages", icon: Users },
      { name: "Documentation", href: "/admin/docs", icon: FileText },
      { name: "Multilevel", href: "/admin/multi", icon: ChevronDown },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell w-full min-h-screen bg-[#F0F2F5] flex font-sans text-slate-900 overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1A1A1A] text-[#909090] flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 gap-3 shrink-0">
          <div className="w-8 h-8 flex items-center justify-center">
             <div className="w-2.5 h-2.5 bg-red-600 rounded-full mr-1"></div>
             <span className="text-white font-black text-2xl tracking-tight uppercase italic">HOUND</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-4 no-scrollbar">
          {SIDEBAR_GROUPS.map((group, idx) => (
            <div key={idx} className="mb-6">
               <h3 className="px-6 text-[11px] font-black text-[#606060] uppercase mb-4 tracking-wider">{group.title}</h3>
               <div className="space-y-0.5">
                  {group.links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`group flex items-center justify-between px-6 py-3 transition-all border-l-4 ${
                          isActive 
                          ? 'bg-[#121212] text-white border-red-600' 
                          : 'border-transparent hover:bg-[#202020] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                           <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#606060] group-hover:text-white'}`} />
                           <span className="text-[13px] font-medium">{link.name}</span>
                        </div>
                        {link.badge && (
                          <span className={`${link.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
               </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Framework */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#1A1A1A] px-8 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-6">
              <button className="text-[#909090] hover:text-white transition-colors">
                <Menu className="w-5 h-5" />
              </button>
              <div className="relative group">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#606060]" />
                 <input 
                    type="text" 
                    placeholder="Search" 
                    className="bg-[#2A2A2A] border-none rounded-full py-2 px-6 text-sm w-[450px] text-white outline-none focus:bg-[#333] transition-all" 
                 />
              </div>
           </div>

           <div className="flex items-center gap-6 text-[#909090]">
              <Settings className="w-4 h-4 cursor-pointer hover:text-white" />
              <Grid className="w-4 h-4 cursor-pointer hover:text-white" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
              <div className="relative cursor-pointer hover:text-white">
                 <Bell className="w-4 h-4" />
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] flex items-center justify-center font-bold rounded-full">5</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#303030] overflow-hidden cursor-pointer ml-2 border border-white/5">
                 <img src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff" alt="Profile" className="w-full h-full object-cover" />
              </div>
           </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1">
            {children}
        </main>
      </div>
    </div>
  );
}
