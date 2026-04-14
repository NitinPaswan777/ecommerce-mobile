"use client";

import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  ExternalLink,
  RotateCw,
  MoreVertical,
  Download,
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";

const lineData = [
  { name: 'Jan', user1: 100, user2: 150, user3: 80 },
  { name: 'Feb', user1: 180, user2: 200, user3: 120 },
  { name: 'April', user1: 220, user2: 210, user3: 140 },
  { name: 'June', user1: 190, user2: 250, user3: 180 },
  { name: 'Aug', user1: 240, user2: 180, user3: 160 },
  { name: 'Sep', user1: 220, user2: 190, user3: 130 },
  { name: 'Oct', user1: 450, user2: 210, user3: 100 },
  { name: 'Dec', user1: 220, user2: 230, user3: 110 },
];

const pieData = [
  { name: 'Organic', value: 44.46, color: '#2563EB' },
  { name: 'Refiral', value: 5.54, color: '#10B981' },
  { name: 'Other', value: 50, color: '#F59E0B' },
];

const sparkLine = [
  { v: 10 }, { v: 15 }, { v: 8 }, { v: 22 }, { v: 18 }, { v: 25 }, { v: 20 }, { v: 35 }
];

export default function HoundDashboard() {
  return (
    <div className="space-y-6">
      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="VISITS" 
            value="914,001" 
            bgColor="bg-[#F82F3E]" 
            icon={<Users className="w-10 h-10 text-white" />} 
        />
        <StatCard 
            title="BOUNCE RATE" 
            value="46.41%" 
            bgColor="bg-[#F6BB42]" 
            icon={<ArrowUpRight className="w-10 h-10 text-white" />} 
        />
        <StatCard 
            title="PAGEVIEWS" 
            value="4,054,876" 
            bgColor="bg-[#10B981]" 
            icon={<FileText className="w-10 h-10 text-white" />} 
        />
        <StatCard 
            title="GROWTH RATE" 
            value="46.43%" 
            bgColor="bg-[#2563EB]" 
            isChart={true}
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* User Statistics Line Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-700">User Statistics</h3>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-5 bg-blue-100 rounded-full relative p-0.5 cursor-pointer">
                        <div className="w-4 h-4 bg-blue-600 rounded-full translate-x-5" />
                    </div>
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                        <CartesianGrid vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} domain={[0, 500]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="user1" stroke="#F82F3E" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#F82F3E' }} />
                        <Line type="monotone" dataKey="user2" stroke="#F6BB42" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#F6BB42' }} />
                        <Line type="monotone" dataKey="user3" stroke="#2563EB" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#2563EB' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-8">
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-widest">Weekly Users</p>
                    <p className="text-xl font-black text-slate-700">324,222</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-widest">Monthly Users</p>
                    <p className="text-xl font-black text-slate-700">123,432</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-widest">Trend</p>
                    <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto" />
                </div>
            </div>
        </div>

        {/* Customer Satisfaction & Browser Stats */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white p-8 rounded-lg shadow-sm h-1/2">
                <div className="text-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Customer Satisfaction</h3>
                    <div className="text-[56px] font-black text-emerald-500 leading-none mb-4">93.13%</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 relative">
                        <div className="absolute top-0 left-0 w-[93%] h-full bg-emerald-500 rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Previous</p>
                            <p className="text-base font-bold text-slate-700">79.82</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">% Change</p>
                            <p className="text-base font-bold text-slate-700">+14.29</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Trend</p>
                            <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm flex-1">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Browser Stats</h3>
                    <div className="flex items-center gap-2">
                        <Download className="w-3 h-3 text-slate-300" />
                        <X className="w-3 h-3 text-slate-300" />
                    </div>
                </div>
                <div className="space-y-6">
                    <BrowserItem name="Google Chrome" value="50%" color="bg-[#F6BB42]" />
                    <BrowserItem name="Mozila Firefox" value="10%" color="bg-[#F82F3E]" />
                    <BrowserItem name="Internet Explorer" value="30%" color="bg-[#10B981]" />
                    <BrowserItem name="Safari" value="10%" color="bg-[#2563EB]" />
                </div>
            </div>
        </div>

        {/* Traffic Sources Pie Chart */}
        <div className="col-span-12 bg-white rounded-lg shadow-sm grid grid-cols-12 overflow-hidden">
             <div className="col-span-8 p-10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-base font-bold text-slate-700">Visit By Traffic Types</h3>
                    <div className="flex items-center gap-3">
                        <RotateCw className="w-4 h-4 text-slate-300" />
                        <MoreVertical className="w-4 h-4 text-slate-300" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                    <div className="h-64 h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={100}
                                    paddingAngle={0}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col justify-center space-y-8">
                         {pieData.map((item, i) => (
                             <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
                                   <div>
                                      <p className="text-sm font-black text-slate-700">{item.value}% {item.name}</p>
                                      <p className="text-[11px] text-slate-400 font-bold uppercase">245 Visits</p>
                                   </div>
                                </div>
                                <div className="w-16 h-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={sparkLine}>
                                            <Area type="monotone" dataKey="v" stroke={item.color} fill={item.color} fillOpacity={0.1} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                             </div>
                         ))}
                    </div>
                </div>
             </div>
             <div className="col-span-4 bg-slate-50 border-l border-slate-100 p-10 flex flex-col justify-center">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Advertising & Promotions</p>
                 <div className="space-y-6">
                    <div className="h-24 bg-white rounded-lg border border-slate-200" />
                    <div className="h-24 bg-white rounded-lg border border-slate-200" />
                 </div>
             </div>
        </div>

        {/* Social Campaigns Table Footer */}
        <div className="col-span-12 bg-white rounded-lg shadow-sm">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Social Campaigns</h3>
                <div className="flex items-center gap-3">
                   <RotateCw className="w-4 h-4 text-slate-300" />
                   <div className="w-4 h-4 border-2 border-slate-200 rounded text-slate-300 flex items-center justify-center">
                      <div className="w-full h-full p-0.5"><div className="w-full h-full bg-slate-200" /></div>
                   </div>
                   <MoreVertical className="w-4 h-4 text-slate-300" />
                </div>
             </div>
             <div className="p-8">
                <div className="grid grid-cols-5 gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4 mb-4">
                    <div>Campaign</div>
                    <div>Client</div>
                    <div>Changes</div>
                    <div>Budget</div>
                    <div className="text-right">Status</div>
                </div>
                {[
                  { n: "Facebook Ads", c: "Meta Global", ch: "-4%", b: "$ 480", s: "PAUSED", sc: "text-amber-500 bg-amber-50" },
                  { n: "Youtube Promo", c: "G-Studio", ch: "+12%", b: "$ 1,200", s: "ACTIVE", sc: "text-emerald-500 bg-emerald-50" },
                  { n: "Twitter Feed", c: "X-Labs", ch: "+2%", b: "$ 240", s: "CLOSED", sc: "text-slate-400 bg-slate-50" },
                ].map((row, i) => (
                    <div key={i} className="grid grid-cols-5 gap-4 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <div className="text-sm font-bold text-slate-900">{row.n}</div>
                        <div className="text-sm font-medium text-slate-500">{row.c}</div>
                        <div className={`text-sm font-black ${row.ch.includes('+') ? 'text-emerald-500' : 'text-red-500'}`}>{row.ch}</div>
                        <div className="text-sm font-black text-slate-900">{row.b}</div>
                        <div className="text-right">
                           <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${row.sc}`}>{row.s}</span>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, bgColor, icon, isChart }: any) {
    return (
        <div className={`${bgColor} p-8 rounded-lg shadow-sm flex items-center justify-between text-white relative overflow-hidden group`}>
            <div>
                <h3 className="text-[40px] font-black leading-none mb-2">{value}</h3>
                <p className="text-[11px] font-bold tracking-widest opacity-80 uppercase">{title}</p>
            </div>
            <div className="shrink-0">
                {isChart ? (
                   <div className="w-24 h-12 flex items-center justify-center gap-1.5">
                      {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                          <div key={i} className="w-1.5 bg-white/40 rounded-full" style={{ height: `${h}%` }} />
                      ))}
                   </div>
                ) : icon}
            </div>
            {title === "BOUNCE RATE" && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 rotate-45">
                    <RotateCw className="w-32 h-32 text-white" />
                </div>
            )}
        </div>
    );
}

function BrowserItem({ name, value, color }: any) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-bold text-slate-600 tracking-tight">{name}</span>
                <span className={`text-[11px] font-black text-white ${color} px-2 py-0.5 rounded-lg`}>{value}</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full">
                <div className={`${color} h-full rounded-full`} style={{ width: value }} />
            </div>
        </div>
    );
}
