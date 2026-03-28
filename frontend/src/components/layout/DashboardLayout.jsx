import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, User, Activity, Menu, X } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useState } from 'react';

export default function DashboardLayout() {
  const { user, logout, notifications } = useAppStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.length;

  return (
    <div className="flex h-screen bg-[#0d0d0f] text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="glass border-r border-white/5 relative z-20 flex-col hidden md:flex"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sidebarOpen ? (
              <video autoPlay muted loop playsInline className="w-full max-w-[180px] h-auto rounded-lg">
                <source src="/WardWatch.mp4" type="video/mp4" />
              </video>
            ) : (
              <Activity className="text-neon-blue" size={28} />
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-500 hover:text-white transition">
            <Menu size={20} />
          </button>
        </div>

        <div className="flex-1 px-4 py-8 relative">
          {/* Sidebar Navigation */}
          {sidebarOpen && <div className="text-xs uppercase text-zinc-500 tracking-wider mb-4 ml-2 mt-4">Command Modules</div>}
          <div className={`p-3 rounded-xl flex items-center gap-3 bg-white/10 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)] border border-white/10 transition-all ${!sidebarOpen && 'justify-center'}`}>
            <Activity size={20} className="text-neon-blue" />
            {sidebarOpen && <span className="font-bold">{user?.role === 'Administrator' ? 'Global Admin' : 'Tactical Center'}</span>}
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        {/* Topbar */}
        <header className="h-20 glass border-b border-white/5 flex items-center justify-between px-6 md:px-10 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Toggle could go here */}
            <div className="hidden md:block">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-neon-blue to-neon-purple">
                {user?.role} Portal
              </h2>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <span>Yield 4:00 PM</span>
              <span>92% <Activity size={12} className="inline ml-1" /></span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-300 px-3 py-1.5 rounded-full text-xs font-bold">
              <span>Yield 8:00 PM</span>
              <span>88%</span>
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-neon-blue to-neon-purple flex items-center justify-center font-bold shadow-lg shadow-purple-500/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-right leading-tight">
                <div className="font-bold text-sm">{user?.name}</div>
                <div className="text-xs text-zinc-400">{user?.role}</div>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 glass rounded-full hover:bg-white/10 transition relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-surface" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-80 glass border border-white/10 rounded-2xl shadow-2xl overflow-hidden origin-top-right z-50"
                  >
                    <div className="p-4 border-b border-white/5 font-bold flex justify-between items-center">
                      <span>Notifications</span>
                      <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-1 rounded-full">{unreadCount} New</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">No new notifications</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="p-4 border-b border-white/5 hover:bg-white/5 transition">
                            <div className="flex gap-3">
                              <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'CLEANING' ? 'bg-neon-blue' : 'bg-neon-purple'}`} />
                              <div className="text-sm text-zinc-300">{n.message}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative">
          
          {/* Escalation Banner (Mock) */}
          {user?.role !== 'Administrator' && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl shadow-lg">
              <Activity size={18} className="shrink-0" />
              <div className="text-sm font-semibold">Capacity Crunch: Projected &gt; 90% utilization by 4:00 PM. Triage Override recommended.</div>
            </div>
          )}

          {/* Subtle bg glow for content area */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 w-full h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
